// Vertex Shader - Định nghĩa shader xử lý đỉnh cho WebGL
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' + // Khai báo thuộc tính a_Position (vị trí đỉnh, dạng vec4: x, y, z, w)
    'attribute vec2 a_texCoord;\n' + // Khai báo thuộc tính a_texCoord (tọa độ texture, dạng vec2: u, v)
    'uniform mat4 u_xformMatrix;\n' + // Khai báo uniform u_xformMatrix (ma trận biến đổi 4x4)
    'varying vec2 v_texCoord;\n' + // Khai báo biến varying v_texCoord để truyền tọa độ texture sang Fragment Shader
    'void main() {\n' + // Hàm chính của Vertex Shader
    '   gl_Position = u_xformMatrix * a_Position;\n' + // Tính toán vị trí cuối cùng của đỉnh bằng cách nhân ma trận biến đổi với vị trí gốc
    '   v_texCoord = a_texCoord;\n' + // Gán tọa độ texture từ attribute sang varying để truyền tiếp
    '}\n'; // Kết thúc Vertex Shader

// Fragment Shader - Định nghĩa shader xử lý màu sắc cho từng pixel
var FSHADER_SOURCE =
    'precision mediump float;\n' + // Đặt độ chính xác trung bình cho các phép toán float
    'varying vec2 v_texCoord;\n' + // Nhận tọa độ texture từ Vertex Shader qua biến varying
    'uniform sampler2D u_Sampler;\n' + // Khai báo uniform u_Sampler để truy cập dữ liệu texture
    'void main() {\n' + // Hàm chính của Fragment Shader
    '   gl_FragColor = texture2D(u_Sampler, v_texCoord);\n' + // Gán màu cho pixel dựa trên texture tại tọa độ v_texCoord
    '}\n'; // Kết thúc Fragment Shader

// Biến toàn cục - Khai báo các biến dùng chung trong chương trình
var sphereBuffer, cubeBuffer; // Buffer lưu trữ dữ liệu đỉnh của hình cầu và hình lập phương
var sphereTexCoordBuffer, sphereIndexBuffer; // Buffer lưu trữ tọa độ texture và chỉ số của hình cầu
var cubeAngle = 0, sphereAngle = 0; // Góc quay của hình lập phương và hình cầu (đơn vị: độ)
var isCubeRotating = false, isCubeTransparent = false; // Trạng thái quay và trong suốt của hình lập phương
var xformMatrix = new Matrix4(); // Ma trận biến đổi 4x4 (dùng thư viện Matrix4)
var sphereX = 0.0, sphereY = 0.0; // Tọa độ tâm của hình cầu trên trục x và y
var sphereRadius = 0.2; // Bán kính hình cầu
var textureLoaded = false; // Trạng thái tải texture (true nếu tải thành công)
var numLatitudeBands = 20, numLongitudeBands = 20; // Số vĩ tuyến và kinh tuyến để tạo lưới hình cầu
var texture; // Biến lưu trữ texture
var gl, a_Position, a_texCoord, u_xformMatrix, u_Sampler; // Biến WebGL và các vị trí của attribute/uniform

function main() { // Hàm chính để khởi tạo và chạy chương trình
    var canvas = document.getElementById('webGL'); // Lấy tham chiếu đến phần tử canvas trong HTML
    gl = getWebGLContext(canvas); // Lấy context WebGL từ canvas
    initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE); // Khởi tạo và biên dịch shader

    a_Position = gl.getAttribLocation(gl.program, 'a_Position'); // Lấy vị trí của attribute a_Position trong shader
    a_texCoord = gl.getAttribLocation(gl.program, 'a_texCoord'); // Lấy vị trí của attribute a_texCoord trong shader
    u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix'); // Lấy vị trí của uniform u_xformMatrix
    u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler'); // Lấy vị trí của uniform u_Sampler

    var sphereData = generateSphere(sphereRadius, numLatitudeBands, numLongitudeBands); // Tạo dữ liệu đỉnh, texture và chỉ số cho hình cầu
    sphereBuffer = gl.createBuffer(); // Tạo buffer cho đỉnh của hình cầu
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffer); // Gắn buffer vào target ARRAY_BUFFER
    gl.bufferData(gl.ARRAY_BUFFER, sphereData.vertices, gl.STATIC_DRAW); // Đổ dữ liệu đỉnh vào buffer

    sphereTexCoordBuffer = gl.createBuffer(); // Tạo buffer cho tọa độ texture của hình cầu
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereTexCoordBuffer); // Gắn buffer vào target ARRAY_BUFFER
    gl.bufferData(gl.ARRAY_BUFFER, sphereData.texCoords, gl.STATIC_DRAW); // Đổ dữ liệu tọa độ texture vào buffer

    sphereIndexBuffer = gl.createBuffer(); // Tạo buffer cho chỉ số của hình cầu
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIndexBuffer); // Gắn buffer vào target ELEMENT_ARRAY_BUFFER
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphereData.indices, gl.STATIC_DRAW); // Đổ dữ liệu chỉ số vào buffer

    var cubeData = generateCube(); // Tạo dữ liệu đỉnh và tọa độ texture cho hình lập phương
    cubeBuffer = gl.createBuffer(); // Tạo buffer cho hình lập phương
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer); // Gắn buffer vào target ARRAY_BUFFER
    gl.bufferData(gl.ARRAY_BUFFER, cubeData.vertices, gl.STATIC_DRAW); // Đổ dữ liệu đỉnh vào buffer

    gl.clearColor(1.0, 1.0, 1.0, 1.0); // Đặt màu nền là trắng (RGBA)
    gl.enable(gl.DEPTH_TEST); // Bật kiểm tra độ sâu để xử lý chồng lấp vật thể

    var image = new Image(); // Tạo đối tượng ảnh để tải texture
    image.crossOrigin = "anonymous"; // Cho phép tải ảnh từ nguồn khác (tránh lỗi CORS)
    image.onload = function() { // Hàm gọi khi ảnh tải thành công
        textureLoaded = true; // Đánh dấu texture đã tải
        initTexture(image); // Khởi tạo texture từ ảnh
        tick(); // Bắt đầu vòng lặp vẽ
    };
    image.onerror = function() { // Hàm gọi khi tải ảnh thất bại
        console.error('Không tải được texture'); // In lỗi ra console
        textureLoaded = false; // Đánh dấu texture không tải được
        tick(); // Vẫn chạy vòng lặp vẽ dù không có texture
    };
    image.src = 'crate.gif'; // Đặt nguồn ảnh (thay bằng đường dẫn thực tế)

    tick(); // Bắt đầu vòng lặp vẽ ngay lập tức
}

function generateSphere(radius, latBands, longBands) { // Hàm tạo dữ liệu cho hình cầu
    var vertices = [], texCoords = [], indices = []; // Mảng lưu đỉnh, tọa độ texture và chỉ số
    for (var lat = 0; lat <= latBands; lat++) { // Duyệt qua các vĩ tuyến
        var theta = lat * Math.PI / latBands; // Tính góc theta (vĩ độ) theo radian
        var sinTheta = Math.sin(theta); // Sin của theta
        var cosTheta = Math.cos(theta); // Cos của theta
        for (var long = 0; long <= longBands; long++) { // Duyệt qua các kinh tuyến
            var phi = long * 2 * Math.PI / longBands; // Tính góc phi (kinh độ) theo radian
            var sinPhi = Math.sin(phi); // Sin của phi
            var cosPhi = Math.cos(phi); // Cos của phi
            var x = cosPhi * sinTheta; // Tọa độ x của đỉnh trên hình cầu
            var y = cosTheta; // Tọa độ y của đỉnh trên hình cầu
            var z = sinPhi * sinTheta; // Tọa độ z của đỉnh trên hình cầu
            var u = 1 - (long / longBands); // Tọa độ texture u (ngang)
            var v = 1 - (lat / latBands); // Tọa độ texture v (dọc)
            vertices.push(radius * x, radius * y, radius * z); // Thêm tọa độ đỉnh (nhân với bán kính)
            texCoords.push(u, v); // Thêm tọa độ texture
        }
    }
    for (var lat = 0; lat < latBands; lat++) { // Tạo chỉ số cho các tam giác
        for (var long = 0; long < longBands; long++) { // Duyệt qua từng ô lưới
            var first = (lat * (longBands + 1)) + long; // Chỉ số đỉnh đầu tiên
            var second = first + longBands + 1; // Chỉ số đỉnh thứ hai
            indices.push(first, second, first + 1); // Tam giác thứ nhất
            indices.push(second, second + 1, first + 1); // Tam giác thứ hai
        }
    }
    return { // Trả về dữ liệu
        vertices: new Float32Array(vertices), // Chuyển mảng đỉnh thành Float32Array
        texCoords: new Float32Array(texCoords), // Chuyển mảng tọa độ texture thành Float32Array
        indices: new Uint16Array(indices) // Chuyển mảng chỉ số thành Uint16Array
    };
}

function generateCube() { // Hàm tạo dữ liệu cho hình lập phương
    var vertices = new Float32Array([ // Dữ liệu đỉnh và tọa độ texture cho 6 mặt
        // Mặt trước
        -0.5, -0.5,  0.5, 0.0, 0.0, // Đỉnh dưới trái, tọa độ texture (0,0)
         0.5, -0.5,  0.5, 1.0, 0.0, // Đỉnh dưới phải, tọa độ texture (1,0)
        -0.5,  0.5,  0.5, 0.0, 1.0, // Đỉnh trên trái, tọa độ texture (0,1)
         0.5,  0.5,  0.5, 1.0, 1.0, // Đỉnh trên phải, tọa độ texture (1,1)
        // Mặt sau
        -0.5, -0.5, -0.5, 0.0, 0.0, // Đỉnh dưới trái, tọa độ texture (0,0)
         0.5, -0.5, -0.5, 1.0, 0.0, // Đỉnh dưới phải, tọa độ texture (1,0)
        -0.5,  0.5, -0.5, 0.0, 1.0, // Đỉnh trên trái, tọa độ texture (0,1)
         0.5,  0.5, -0.5, 1.0, 1.0, // Đỉnh trên phải, tọa độ texture (1,1)
        // Mặt trên
        -0.5,  0.5,  0.5, 0.0, 0.0, // Đỉnh trước trái, tọa độ texture (0,0)
         0.5,  0.5,  0.5, 1.0, 0.0, // Đỉnh trước phải, tọa độ texture (1,0)
        -0.5,  0.5, -0.5, 0.0, 1.0, // Đỉnh sau trái, tọa độ texture (0,1)
         0.5,  0.5, -0.5, 1.0, 1.0, // Đỉnh sau phải, tọa độ texture (1,1)
        // Mặt dưới
        -0.5, -0.5,  0.5, 0.0, 0.0, // Đỉnh trước trái, tọa độ texture (0,0)
         0.5, -0.5,  0.5, 1.0, 0.0, // Đỉnh trước phải, tọa độ texture (1,0)
        -0.5, -0.5, -0.5, 0.0, 1.0, // Đỉnh sau trái, tọa độ texture (0,1)
         0.5, -0.5, -0.5, 1.0, 1.0, // Đỉnh sau phải, tọa độ texture (1,1)
        // Mặt trái
        -0.5, -0.5,  0.5, 0.0, 0.0, // Đỉnh dưới trước, tọa độ texture (0,0)
        -0.5,  0.5,  0.5, 0.0, 1.0, // Đỉnh trên trước, tọa độ texture (0,1)
        -0.5, -0.5, -0.5, 1.0, 0.0, // Đỉnh dưới sau, tọa độ texture (1,0)
        -0.5,  0.5, -0.5, 1.0, 1.0, // Đỉnh trên sau, tọa độ texture (1,1)
        // Mặt phải
         0.5, -0.5,  0.5, 0.0, 0.0, // Đỉnh dưới trước, tọa độ texture (0,0)
         0.5,  0.5,  0.5, 0.0, 1.0, // Đỉnh trên trước, tọa độ texture (0,1)
         0.5, -0.5, -0.5, 1.0, 0.0, // Đỉnh dưới sau, tọa độ texture (1,0)
         0.5,  0.5, -0.5, 1.0, 1.0 // Đỉnh trên sau, tọa độ texture (1,1)
    ]);
    return { vertices: vertices }; // Trả về dữ liệu đỉnh
}

function initTexture(image) { // Hàm khởi tạo texture từ ảnh
    texture = gl.createTexture(); // Tạo đối tượng texture
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Lật ảnh theo trục Y để khớp với tọa độ WebGL
    gl.activeTexture(gl.TEXTURE0); // Kích hoạt texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, texture); // Gắn texture vào target TEXTURE_2D
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); // Đặt bộ lọc khi thu nhỏ là tuyến tính
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image); // Tải dữ liệu ảnh vào texture
    gl.uniform1i(u_Sampler, 0); // Gán texture unit 0 cho u_Sampler
}

function tick() { // Hàm vòng lặp vẽ liên tục
    sphereAngle += 0.5; // Tăng góc quay của hình cầu (0.5 độ mỗi khung hình)
    if (isCubeRotating) cubeAngle += 0.5; // Tăng góc quay của hình lập phương nếu đang bật quay

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Xóa buffer màu và độ sâu
    drawCube(); // Vẽ hình lập phương
    drawSphere(); // Vẽ hình cầu
    requestAnimationFrame(tick); // Yêu cầu vẽ lại khung hình tiếp theo
}

function drawCube() { // Hàm vẽ hình lập phương
    var cubeData = generateCube(); // Lấy dữ liệu đỉnh của hình lập phương
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer); // Gắn buffer của hình lập phương vào ARRAY_BUFFER
    gl.bufferData(gl.ARRAY_BUFFER, cubeData.vertices, gl.STATIC_DRAW); // Đổ dữ liệu đỉnh vào buffer

    var FSIZE = cubeData.vertices.BYTES_PER_ELEMENT; // Kích thước mỗi phần tử trong buffer (byte)
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 5, 0); // Cấu hình a_Position: 3 thành phần (x,y,z), bước nhảy 5 float
    gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, FSIZE * 5, FSIZE * 3); // Cấu hình a_texCoord: 2 thành phần (u,v), bắt đầu từ offset 3 float
    gl.enableVertexAttribArray(a_Position); // Kích hoạt attribute a_Position
    gl.enableVertexAttribArray(a_texCoord); // Kích hoạt attribute a_texCoord

    xformMatrix.setIdentity(); // Đặt ma trận biến đổi về ma trận đơn vị
    xformMatrix.rotate(cubeAngle, 1.0, 1.0, 1.0); // Xoay hình lập phương theo góc cubeAngle quanh trục (1,1,1)
    gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements); // Truyền ma trận biến đổi vào shader

    if (isCubeTransparent) { // Nếu hình lập phương trong suốt
        gl.drawArrays(gl.LINES, 0, 24); // Vẽ khung dây với 24 đỉnh (12 cạnh)
    } else if (textureLoaded) { // Nếu texture đã tải
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);  // Vẽ mặt trước bằng TRIANGLE_STRIP (4 đỉnh)
        gl.drawArrays(gl.TRIANGLE_STRIP, 4, 4);  // Vẽ mặt sau
        gl.drawArrays(gl.TRIANGLE_STRIP, 8, 4);  // Vẽ mặt trên
        gl.drawArrays(gl.TRIANGLE_STRIP, 12, 4); // Vẽ mặt dưới
        gl.drawArrays(gl.TRIANGLE_STRIP, 16, 4); // Vẽ mặt trái
        gl.drawArrays(gl.TRIANGLE_STRIP, 20, 4); // Vẽ mặt phải
    } else { // Nếu texture chưa tải
        gl.drawArrays(gl.LINES, 0, 24); // Vẽ khung dây với 24 đỉnh
    }
}

function drawSphere() { // Hàm vẽ hình cầu
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffer); // Gắn buffer đỉnh của hình cầu
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0); // Cấu hình a_Position: 3 thành phần, không bước nhảy
    gl.enableVertexAttribArray(a_Position); // Kích hoạt a_Position

    gl.bindBuffer(gl.ARRAY_BUFFER, sphereTexCoordBuffer); // Gắn buffer tọa độ texture của hình cầu
    gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 0, 0); // Cấu hình a_texCoord: 2 thành phần, không bước nhảy
    gl.enableVertexAttribArray(a_texCoord); // Kích hoạt a_texCoord

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIndexBuffer); // Gắn buffer chỉ số của hình cầu

    xformMatrix.setIdentity(); // Đặt ma trận biến đổi về ma trận đơn vị
    xformMatrix.translate(sphereX, sphereY, 0.0); // Dịch chuyển hình cầu theo sphereX, sphereY
    xformMatrix.rotate(sphereAngle, 0.0, 1.0, 0.0); // Xoay hình cầu quanh trục y
    gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements); // Truyền ma trận biến đổi vào shader

    gl.drawElements(gl.TRIANGLES, numLatitudeBands * numLongitudeBands * 6, gl.UNSIGNED_SHORT, 0); // Vẽ hình cầu bằng tam giác
}

// Hàm điều khiển
function startRotation() { isCubeRotating = true; } // Bật chế độ quay cho hình lập phương
function stopRotation() { isCubeRotating = false; } // Tắt chế độ quay cho hình lập phương
function openCube() { isCubeTransparent = true; } // Chuyển hình lập phương sang chế độ trong suốt (khung dây)
function wrapCube() { isCubeTransparent = false; } // Chuyển hình lập phương về chế độ bình thường (có texture)

function moveSphereLeft() { // Di chuyển hình cầu sang trái
    var newX = sphereX - 0.05; // Giảm tọa độ x đi 0.05 đơn vị
    sphereX = newX; // Cập nhật tọa độ x mới, không giới hạn
}

function moveSphereRight() { // Di chuyển hình cầu sang phải
    var newX = sphereX + 0.05; // Tăng tọa độ x lên 0.05 đơn vị
    sphereX = newX; // Cập nhật tọa độ x mới, không giới hạn
}

function moveSphereUp() { // Di chuyển hình cầu lên trên
    var newY = sphereY + 0.05; // Tăng tọa độ y lên 0.05 đơn vị
    if (newY <= 0.5 - sphereRadius) sphereY = newY; // Chỉ cập nhật nếu không vượt quá biên trên của hình lập phương (0.3)
}

function moveSphereDown() { // Di chuyển hình cầu xuống dưới
    var newY = sphereY - 0.05; // Giảm tọa độ y đi 0.05 đơn vị
    if (newY >= -0.5 + sphereRadius) sphereY = newY; // Chỉ cập nhật nếu không vượt quá biên dưới của hình lập phương (-0.3)
}

main(); // Gọi hàm chính để chạy chương trình