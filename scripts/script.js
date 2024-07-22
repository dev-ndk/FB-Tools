document.addEventListener("DOMContentLoaded", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        let activeTab = tabs[0];
        let url = new URL(activeTab.url);
        let domain = url.hostname;
        if (!["m.facebook.com", "www.facebook.com", "mbasic.facebook.com"].includes(domain)) {
            return Swal.fire({
                icon: "warning",
                title: "Chỉ hoạt động tại Facebook",
                showConfirmButton: false,
                allowOutsideClick: false,
                timer: 3000,
                timerProgressBar: true,
                width: "380px"
            }).then(() => {
                window.close();
            });
        }
        return onStart(domain);
    });
});

async function onStart(domain) {
    return checkLogin(domain)
        .then(async (fb_dtsg) => {
            switch (domain) {
                case "mbasic.facebook.com":
                    return await mbasic(fb_dtsg);
                case "www.facebook.com":
                    return await facebook(fb_dtsg);
                case "m.facebook.com":
                    return await m_facebook(fb_dtsg);
            }
        })
        .catch((e) => {
            console.log(e);
            return errorAlert({
                title: "Đã xảy ra lỗi",
                callback: () => {
                    window.close();
                }
            });
        });
}

async function facebook(fb_dtsg) {
    let cookies = await chrome.cookies.getAll({ domain: "facebook.com" });
    const cookie = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
    let cok = cookies.map((v) => ({
        key: v.name,
        value: v.value,
        domain: "facebook.com",
        path: v.path,
        hostOnly: v.hostOnly,
        creation: new Date().toISOString(),
        lastAccessed: new Date().toISOString()
    }));
    let fbstate = JSON.stringify(cok, null, 4);

    $("#floatingTextarea").val(fbstate);

    $("#btn-get-token").click(async function () {
        try {
            const loadGetToken = Swal.fire({
                title: "Đang xử lý",
                html: "Vui lòng đợi trong giây lát.",
                allowOutsideClick: !1,
                showConfirmButton: !1,
                timerProgressBar: !0,
                width: "380px",
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            const app_id = $("#app-id").val();

            const form = new URLSearchParams();
            form.append("cookie", cookie);
            form.append("app_id", app_id);
            form.append("fb_dtsg", fb_dtsg);

            const { data: result } = await axios({
                method: "POST",
                url: "https://dev-ndk.id.vn/api/v1/facebook/token",
                data: form
            });
            if (result.status == "ok") {
                loadGetToken.close();
                $("#result-token").removeClass("d-none");
                $("#input-token").val(result.data);
                successAlert({ title: "Thành công", text: "Đã lấy token thành công", timer: 1000 });
            }
            if (result.status == "error") {
                loadGetToken.close();
                errorAlert({ title: "Kiểm tra đăng nhập", text: result.message, timer: 1500 });
            }
        } catch (error) {
            console.error(error);
            return errorAlert({ title: "Đã xảy ra lỗi khi lấy token", timer: 3000 });
        }
    });

    $("#btn-copy-token").click(function () {
        const inputValue = $("#input-token").val();
        return copyToClipboard({ text: inputValue, success: "Copy token thành công!", error: "Đã xảy ra lỗi khi copy token!" });
    });

    $("#btn-copy-fbstate").click(function () {
        const inputValue = $("#floatingTextarea").val();
        return copyToClipboard({ text: inputValue, success: "Copy FB-State thành công!", error: "Đã xảy ra lỗi khi copy FB-State!" });
    });

    $("#btn-copy-cookie").click(function () {
        return copyToClipboard({ text: cookie, success: "Copy Cookie thành công!", error: "Đã xảy ra lỗi khi copy Cookie!" });
    });

    $("#btn-down-fbstate").click(function () {
        const Toast = ToastAlert();
        let blob = stringToBlob(fbstate, "application/json");
        let url = window.webkitURL || window.URL || window.mozURL || window.msURL;
        const nameFile = $("#input-name-file").val();
        let a = document.createElement("a");
        a.download = `${nameFile}.json`;
        a.href = url.createObjectURL(blob);
        a.textContent = "";
        a.dataset.downloadurl = ["json", a.download, a.href].join(":");
        a.click();
        Toast.fire({
            icon: "success",
            title: "Download FB-State thành công!"
        });
        return a.remove();
    });

    $("#btn-logout-fbstate").click(function () {
        return Swal.fire({
            text: "Bạn muốn đăng xuất Facebook?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, Logout!",
            allowOutsideClick: false,
            width: "380px"
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    text: "Đăng xuất Facebook thành công",
                    icon: "success",
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    timer: 1000,
                    timerProgressBar: true,
                    width: "380px"
                }).then(() => {
                    chrome.cookies.getAll(
                        {
                            domain: "facebook.com"
                        },
                        function (cookies) {
                            cookies = cookies.filter((c) => c.name != "sb" && c.name != "dbln");
                            for (let i in cookies) {
                                chrome.cookies.remove({
                                    url: `https://facebook.com${cookies[i].path}`,
                                    name: cookies[i].name
                                });
                            }
                            chrome.tabs.query(
                                {
                                    active: true
                                },
                                function (tabs) {
                                    const { host } = new URL(tabs[0].url);
                                    if (host.split(".")[1] == "facebook") {
                                        window.close();
                                        chrome.tabs.update(tabs[0].id, {
                                            url: tabs[0].url
                                        });
                                    }
                                }
                            );
                        }
                    );
                });
            }
        });
    });

    $("#btn-paste-url").click(function () {
        return navigator.clipboard.readText().then((text) => {
            $("#input-url-download").val(text);
        });
    });

    $("#btn-download-video").click(async function () {
        const url = $("#input-url-download").val();
        if (!isValidURL(url)) return errorAlert({ text: "URL không hợp lệ", timer: 1500 });

        const loadDownload = Swal.fire({
            title: "Đang xử lý",
            html: "Vui lòng đợi trong giây lát.",
            allowOutsideClick: !1,
            showConfirmButton: !1,
            timerProgressBar: !0,
            width: "380px",
            didOpen: () => {
                Swal.showLoading();
            }
        });
        try {
            const { data } = await axios.get(url, {
                headers: {
                    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"
                }
            });

            const parser = new DOMParser();
            const doc = parser.parseFromString(data, "text/html");
            const scripts = $(doc).find('script[type="application/json"]');
            let videoData = [];
            let titelDate = [];

            scripts.each(function () {
                const scriptContent = $(this).html();
                if (scriptContent.includes("playlist")) {
                    videoData.push(JSON.parse(scriptContent));
                }
                if (scriptContent.includes("CometFeedStoryDefaultMessageRenderingStrategy")) {
                    titelDate.push(JSON.parse(scriptContent));
                }
            });

            let video = lodashArray(videoData, "__bbox.result", url);
            let tile = lodashArray(titelDate, "__bbox.result.data", url);
            if (!video) return errorAlert({ title: "Không tìm thấy video", timer: 1500 });
            const getDataVideo = findParentKeysWithPlaylist(video);
            const getAudio = findMimeType(video.extensions, "audio/mp4");
            const getTitle = findTitlesAndMessages(tile);
            $.each(getDataVideo, function (index, obj) {
                const data = _.get(video, obj);
                let html = `<div class="d-flex w-100 justify-content-between align-items-center border border-primary-subtle shadow_hover p-2 rounded-3 mb-2" style="height: 100px; gap: 0.8rem" >`;
                html += `<a class="position-relative downloadLink" href="${data.preferred_thumbnail.image.uri}" >`;
                html += `<img src="${data.preferred_thumbnail.image.uri}" data-bs-toggle="tooltip" data-bs-placement="right" data-bs-title="Download Thumbnail" class="img-thumbnail rounded shadow-tad h-100" style="width: 150px; object-fit: contain" alt="${getTitle[0]}" />`;
                html += `<span class="position-absolute translate-middle text-bg-success border border-light rounded-circle" style="top: 5px; left: 97%; padding: 1px" >`;
                html += `<span class="position-absolute translate-middle text-bg-success border border-light rounded-circle" style="top: 5px; left: 97%; padding: 1px" >`;
                html += `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-down-circle-fill" viewBox="0 0 16 16" >`;
                html += `<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v5.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293z" />`;
                html += `</svg>`;
                html += `</span>`;
                html += `</a>`;
                html += `<div class="d-flex flex-column gap-2">`;
                html += `<button data-href="${
                    data.browser_native_sd_url
                }" class="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 justify-content-center downloadLink" style="width: 120px" ${
                    data.browser_native_sd_url ? "" : "disabled"
                }>`;
                html += `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-badge-sd" viewBox="0 0 16 16" >`;
                html += `<path fill-rule="evenodd" d="M15 4a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1zM0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm5.077 7.114c-1.524 0-2.263-.8-2.315-1.749h1.147c.079.466.527.809 1.234.809.739 0 1.13-.339 1.13-.83 0-.418-.3-.634-.923-.779l-.927-.215c-.932-.21-1.52-.747-1.52-1.657 0-1.098.918-1.815 2.24-1.815 1.371 0 2.162.77 2.22 1.692H6.238c-.075-.43-.466-.76-1.103-.76-.655 0-1.046.338-1.046.804 0 .36.294.598.821.712l.932.216c.971.22 1.613.685 1.613 1.691 0 1.117-.857 1.881-2.378 1.881M8.307 11V5.001h2.19c1.823 0 2.684 1.09 2.684 2.984 0 1.908-.874 3.015-2.685 3.015zm2.031-5.032h-.844v4.06h.844c1.116 0 1.622-.667 1.622-2.02 0-1.354-.51-2.04-1.622-2.04" />`;
                html += `</svg>`;
                html += `MP4`;
                html += `</button>`;
                html += `<button style="width: 120px" data-href="${
                    data.browser_native_hd_url
                }" class="btn btn-outline-success btn-sm d-flex align-items-center gap-1 justify-content-center downloadLink" ${
                    data.browser_native_hd_url ? "" : "disabled"
                }>`;
                html += `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-badge-hd" viewBox="0 0 16 16" >`;
                html += `<path d="M7.396 11V5.001H6.209v2.44H3.687V5H2.5v6h1.187V8.43h2.522V11zM8.5 5.001V11h2.188c1.811 0 2.685-1.107 2.685-3.015 0-1.894-.86-2.984-2.684-2.984zm1.187.967h.843c1.112 0 1.622.686 1.622 2.04 0 1.353-.505 2.02-1.622 2.02h-.843z" />`;
                html += `<path d="M14 3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />`;
                html += `</svg>`;
                html += `MP4`;
                html += `</button>`;
                html += `</div>`;
                html += `</div>`;
                $("#download-result .row > div > #video-tab-pane").append(html);
            });
            [...document.querySelectorAll('[data-bs-toggle="tooltip"]')].map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl));

            $.each(getAudio, function (index, obj) {
                let html = `<audio class="w-100 border border-primary-subtle shadow_hover p-2 rounded-3 auto_dow mb-2" controls>`;
                html += `<source src="${obj.base_url}" type="${obj.mime_type}" />`;
                html += `</audio>`;
                $("#download-result .row > div > #audio-tab-pane").append(html);
            });

            if (getDataVideo.length > 1) {
                let btn_downall = `<button id="btn-downAll-video" type="button" class="btn btn-outline-primary d-flex align-items-center justify-content-center gap-1 w-100 btn-sm">`;
                btn_downall += `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi  bi-arrow-down-circle" viewBox="0 0 16 16" >`;
                btn_downall += `<path fill-rule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8m15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v5.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293z" />`;
                btn_downall += `</svg>`;
                btn_downall += `Download All`;
                btn_downall += `</button>`;
                $("#download-result .row > div > #video-tab-pane").append(btn_downall);
            }

            if (getAudio.length > 1) {
                let btn_downall = `<button id="btn-downAll-audio" type="button" class="btn btn-outline-primary d-flex align-items-center justify-content-center gap-1 w-100 btn-sm">`;
                btn_downall += `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi  bi-arrow-down-circle" viewBox="0 0 16 16" >`;
                btn_downall += `<path fill-rule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8m15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v5.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293z" />`;
                btn_downall += `</svg>`;
                btn_downall += `Download All`;
                btn_downall += `</button>`;
                $("#download-result .row > div > #audio-tab-pane").append(btn_downall);
            }

            $("#download-form").addClass("d-none");
            $("#download-result").removeClass("d-none");
            $("#button-home").removeClass("d-none");
            $("#download-title").text(getTitle[0] ? getTitle[0] : "Không có tiêu đề");
            loadDownload.close();

            $("audio").on("play", function () {
                $("audio")
                    .not(this)
                    .each(function (index, audio) {
                        if (!audio.paused) {
                            audio.pause();
                        }
                    });
            });

            $(".downloadLink").on("click", function (event) {
                event.preventDefault();
                Swal.fire({
                    title: "Đang thực hiện tải vui lòng đợi",
                    allowOutsideClick: !1,
                    showConfirmButton: !1,
                    timerProgressBar: !0,
                    width: "380px",
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });
                const urlDownload = $(this).attr("data-href");
                chrome.downloads
                    .download({
                        url: urlDownload
                    })
                    .then(() => {
                        return successAlert({ title: "Tải thành công", timer: 1500 });
                    })
                    .catch((error) => {
                        console.error(error);
                        return errorAlert({ title: "Đã xảy ra lỗi khi tải xuống", timer: 1500 });
                    });
            });

            $("#btn-downAll-video").click(function () {
                Swal.fire({
                    title: "Vui lòng chọn chế độ tải",
                    showDenyButton: true,
                    showCancelButton: true,
                    confirmButtonText: "MP4 (SD)",
                    denyButtonText: `MP4 (HD)`,
                    width: "380px"
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        for (const obj of getDataVideo) {
                            try {
                                const data = _.get(video, obj);
                                const urlDownload = data.browser_native_sd_url;
                                if (!urlDownload) continue;
                                await chrome.downloads.download({
                                    url: urlDownload
                                });
                            } catch (_) {}
                        }
                        return successAlert({ title: "Tải thành công", timer: 1500 });
                    }
                    if (result.isDenied) {
                        for (const obj of getDataVideo) {
                            try {
                                const data = _.get(video, obj);
                                const urlDownload = data.browser_native_hd_url;
                                if (!urlDownload) continue;
                                await chrome.downloads.download({
                                    url: urlDownload
                                });
                            } catch (_) {
                                continue;
                            }
                        }
                        return successAlert({ title: "Tải thành công", timer: 1500 });
                    }
                });
            });

            $("#btn-downAll-audio").click(function () {
                getAudio.forEach(async function (obj) {
                    const urlDownload = obj.base_url;
                    await chrome.downloads.download({
                        url: urlDownload
                    });
                });
                return successAlert({ title: "Tải thành công", timer: 1500 });
            });
        } catch (error) {
            console.log(error);
        }
    });
}

async function m_facebook() {}

async function mbasic() {}

async function checkLogin(domain) {
    return new Promise(async (resolve, reject) => {
        let [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.scripting.executeScript(
            {
                target: { tabId: activeTab.id },
                func: () => {
                    // Thực thi các đoạn mã JavaScript trong nội dung của tab hiện tại
                    return document.documentElement.outerHTML;
                }
            },
            (results) => {
                if (!chrome.runtime.lastError) {
                    // Xử lý kết quả ở đây
                    if (results && results[0] && results[0].result) {
                        let fb_dtsg = "";
                        try {
                        } catch (error) {}
                        switch (domain) {
                            case "mbasic.facebook.com":
                                return;
                            case "www.facebook.com":
                                if (results[0].result.split('"DTSGInitialData",[],{"token":"')[1] == undefined)
                                    return errorAlert({ title: "Vui lòng đăng nhập Facebook trước", timer: 3000, callback: () => window.close() });

                                fb_dtsg = results[0].result.split('"DTSGInitialData",[],{"token":"')[1].split('"')[0];
                                return resolve(fb_dtsg);
                            case "m.facebook.com":
                                return;
                        }
                    } else {
                        reject();
                    }
                } else {
                    console.error("Lỗi khi thực thi executeScript:", chrome.runtime.lastError);
                    reject();
                }
            }
        );
    });
}

function stringToBlob(str, mimetype) {
    var raw = str;
    var rawLength = raw.length;
    var uInt8Array = new Uint8Array(rawLength);

    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    var bb = new Blob([uInt8Array.buffer], {
        type: mimetype
    });
    return bb;
}

function isValidURL(url) {
    const regex =
        /(?:https?:\/\/)?(?:www\.)?(mbasic.facebook|m\.facebook|facebook|fb)\.(com|me|watch)\/(?:(?:\w\.)*#!\/)?(?:pages\/)?(?:[\w\-\.]*\/)*([\w\-\.]*)/;
    return regex.test(url);
}

function lodashArray(array, resultPath, url = "") {
    const comment_id = new URL(url).search.includes("comment_id=");
    const limit = comment_id ? 2 : 1;
    array = _.take(array, limit);

    let data = null;
    array.forEach((item) => {
        const itemData = _([item])
            .map("require")
            .flattenDeep()
            .filter((item) => _.isObject(item) && !_.some(item, (value) => value === null))
            .map("__bbox.require")
            .flattenDeep()
            .filter((item) => _.has(item, "__bbox") && _.isObject(_.get(item, resultPath)))
            .map(resultPath)
            .head();

        if (!data) {
            data = itemData;
        } else {
            data.comment_id = itemData;
        }
    });
    return data;
}

function findParentKeysWithPlaylist(obj) {
    let results = [];

    function searchKey(item, path = "") {
        if (_.isObject(item)) {
            _.forOwn(item, (value, key) => {
                const currentPath = path ? `${path}.${key}` : key;
                if (key === "playlist") {
                    results.push(path);
                } else if (_.isArray(value) || _.isObject(value)) {
                    searchKey(value, currentPath);
                }
            });
        }
    }

    const dataFields = ["bucket", "video", "group", "node", "feedback", "comment_id"];
    dataFields.forEach((field) => {
        if (_.has(obj, `data.${field}`)) {
            searchKey(_.get(obj, `data.${field}`), `data.${field}`);
        }
    });

    return results;
}

function findTitlesAndMessages(obj) {
    let messages = [];

    function searchKey(item) {
        if (_.isObject(item)) {
            _.forOwn(item, (value, key) => {
                if (_.isObject(value) && value.message && value.message.text) {
                    messages.push(value.message.text);
                }
                if (_.isArray(value)) {
                    value.forEach((element) => searchKey(element));
                } else if (_.isObject(value)) {
                    searchKey(value);
                }
            });
        }
    }

    searchKey(obj);
    return messages;
}

function findMimeType(obj, targetMimeType) {
    let results = [];

    function searchKey(item) {
        if (_.isObject(item)) {
            _.forOwn(item, (value, key) => {
                if (key === "mime_type" && value === targetMimeType) {
                    results.push(item);
                }
                if (_.isArray(value)) {
                    value.forEach((element) => searchKey(element));
                } else if (_.isObject(value)) {
                    searchKey(value);
                }
            });
        }
    }

    searchKey(obj);
    return results;
}

function sanitizeFilename(filename) {
    // Các ký tự không hợp lệ trong tên file
    var invalidChars = /[\\/:"*?<>|]/g;

    // Thay thế các ký tự không hợp lệ bằng khoảng trắng
    return filename.replace(invalidChars, " ");
}

$("#button-home").click(function () {
    $("#download-form").removeClass("d-none");
    $("#download-result").addClass("d-none");
    $("#button-home").addClass("d-none");
    $("#download-result .row > div > #video-tab-pane").empty();
    $("#download-result .row > div > #audio-tab-pane").empty();
    $("#download-title").text("Facebook Video Downloader");
});

$(".coming-soon").click(function () {
    return Swal.fire({
        icon: "info",
        title: "Coming Soon",
        showConfirmButton: false,
        allowOutsideClick: false,
        timer: 2000,
        timerProgressBar: true,
        width: "380px"
    });
});

function successAlert({ title, text = "", timer = 1500, callback }) {
    return Swal.fire({
        icon: "success",
        title: title,
        text: text,
        showConfirmButton: false,
        allowOutsideClick: false,
        timer: timer,
        timerProgressBar: true,
        width: "380px"
    }).then(() => {
        if (callback) callback();
    });
}

function errorAlert({ title, text = "", timer = 1500, callback }) {
    return Swal.fire({
        icon: "error",
        title: title,
        text: text,
        showConfirmButton: false,
        allowOutsideClick: false,
        timer: timer,
        timerProgressBar: true,
        width: "380px"
    }).then(() => {
        if (callback) callback();
    });
}

function ToastAlert(time = 1500) {
    return Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: time,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        }
    });
}

async function copyToClipboard({ text, success, error }) {
    const Toast = ToastAlert();
    try {
        await navigator.clipboard.writeText(text);
        Toast.fire({
            icon: "success",
            title: success
        });
    } catch (err) {
        console.error("Lỗi:", err);
        Toast.fire({
            icon: "error",
            title: error
        });
    }
}
