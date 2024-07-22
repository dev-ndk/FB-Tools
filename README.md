# FB-TOOLS: Công Cụ Hỗ Trợ Facebook

## Giới Thiệu

**FB-TOOLS** là bộ công cụ mạnh mẽ hỗ trợ người dùng Facebook với nhiều tính năng hữu ích. Dễ sử dụng và hiệu quả. Hiện tại, công cụ này được phát triển dưới dạng extension cho Google Chrome.

## Tính Năng

-   **Tải Video Facebook**:
    -   Hỗ trợ tải video từ Facebook Watch, Story, Reel, nhóm riêng tư.
    -   Tải video từ phần bình luận kèm theo comment.
-   **Get Token Facebook Full Quyền**:

    -   Lấy token Facebook với đầy đủ quyền hạn.

-   **Get Cookie và FB-State**:

    -   Lấy cookie và fb-state mà không lo bị logout hay die cookie, fb-state.

-   **Cập Nhật**:
    -   Các tính năng khác sẽ được cập nhật trong các phiên bản tiếp theo.

## Cài Đặt

1. Clone repository:

    ```bash
    git clone https://github.com/dev-ndk/FB-Tools.git
    ```

2. Mở Google Chrome và truy cập [chrome://extensions/](chrome://extensions/).
3. Bật chế độ "Developer mode" ở góc trên bên phải.
4. Nhấp vào "Load unpacked" và chọn thư mục fb-tools.

## Hướng Dẫn Sử Dụng

-   **Tải Video Facebook**:

    -   Chọn loại video bạn muốn tải (Watch, Story, Reel, nhóm riêng tư, phần bình luận **_(url kèm comment_id)_**).
    -   Nhập URL của video và nhấn "Tải xuống".

-   **Get Token Facebook**:

    -   Chọn mục "Token".
    -   Chọn loại token muốn lấy và nhấn "Lấy token".

-   **Get Cookie và FB-State**:

    -   Chọn mục "FB-State".
    -   _Có các lựa chọn_:
        -   **Download**: Để tải tải FB-State dạng json có thể sửa tên file.
        -   **Copy FB-State**: Copy không cần tải file.
        -   **Copy Cookie**: Để copy cookie (lưu ý: FB-State và cookie có định dạng khác nhau),
        -   **Logout**: Để logout nick facebook trên web mà không bị die (FB-State, Cookie)

-   **Other**:
    -   Các tính năng khác sẽ được cập nhật trong các phiên bản tiếp theo.

## Tác Giả

-   Made by [DEV-NDK](https://www.facebook.com/ndk.fullstack.dev)

## Đóng Góp

-   Chúng tôi hoan nghênh các đóng góp từ cộng đồng. Vui lòng tạo pull request hoặc mở issue để đóng góp vào dự án này.

## Giấy Phép

-   Dự án này được cấp phép theo [MIT License]()
