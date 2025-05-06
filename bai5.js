// Vertex Shader
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec2 a_texCoord;\n' +
    'uniform mat4 u_xformMatrix;\n' +
    'varying vec2 v_texCoord;\n' +
    'void main() {\n' +
    '   gl_Position = u_xformMatrix * a_Position;\n' +
    '   v_texCoord = a_texCoord;\n' +
    '}\n';

// Fragment Shader
var FSHADER_SOURCE =
    'precision mediump float;\n' +
    'varying vec2 v_texCoord;\n' +
    'uniform sampler2D u_Sampler;\n' +
    'void main() {\n' +
    '   gl_FragColor = texture2D(u_Sampler, v_texCoord);\n' +
    '}\n';

// Biến toàn cục
var sphereBuffer, cubeBuffer;
var sphereTexCoordBuffer, sphereIndexBuffer;
var cubeAngle = 0, sphereAngle = 0;
var isCubeRotating = false, isCubeTransparent = false;
var xformMatrix = new Matrix4();
var sphereX = 0.0, sphereY = 0.0;
var sphereRadius = 0.2;
var textureLoaded = false;
var numLatitudeBands = 20, numLongitudeBands = 20;
var texture;
var gl, a_Position, a_texCoord, u_xformMatrix, u_Sampler;

function main() {
    var canvas = document.getElementById('webGL');
    gl = getWebGLContext(canvas);
    initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);

    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    a_texCoord = gl.getAttribLocation(gl.program, 'a_texCoord');
    u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix');
    u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');

    var sphereData = generateSphere(sphereRadius, numLatitudeBands, numLongitudeBands);
    sphereBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sphereData.vertices, gl.STATIC_DRAW);

    sphereTexCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereTexCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sphereData.texCoords, gl.STATIC_DRAW);

    sphereIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphereData.indices, gl.STATIC_DRAW);

    var cubeData = generateCube();
    cubeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeData.vertices, gl.STATIC_DRAW);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    var image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = function() {
        textureLoaded = true;
        initTexture(image);
        tick();
    };
    image.onerror = function() {
        console.error('Không tải được texture');
        textureLoaded = false;
        tick();
    };
    image.src = 'crate.gif'; // Thay bằng đường dẫn ảnh của bạn

    tick();
}

function generateSphere(radius, latBands, longBands) {
    var vertices = [], texCoords = [], indices = [];
    for (var lat = 0; lat <= latBands; lat++) {
        var theta = lat * Math.PI / latBands;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);
        for (var long = 0; long <= longBands; long++) {
            var phi = long * 2 * Math.PI / longBands;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);
            var x = cosPhi * sinTheta;
            var y = cosTheta;
            var z = sinPhi * sinTheta;
            var u = 1 - (long / longBands);
            var v = 1 - (lat / latBands);
            vertices.push(radius * x, radius * y, radius * z);
            texCoords.push(u, v);
        }
    }
    for (var lat = 0; lat < latBands; lat++) {
        for (var long = 0; long < longBands; long++) {
            var first = (lat * (longBands + 1)) + long;
            var second = first + longBands + 1;
            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }
    return {
        vertices: new Float32Array(vertices),
        texCoords: new Float32Array(texCoords),
        indices: new Uint16Array(indices)
    };
}

function generateCube() {
    var vertices = new Float32Array([
        // Mặt trước
        -0.5, -0.5,  0.5, 0.0, 0.0,
         0.5, -0.5,  0.5, 1.0, 0.0,
        -0.5,  0.5,  0.5, 0.0, 1.0,
         0.5,  0.5,  0.5, 1.0, 1.0,
        // Mặt sau
        -0.5, -0.5, -0.5, 0.0, 0.0,
         0.5, -0.5, -0.5, 1.0, 0.0,
        -0.5,  0.5, -0.5, 0.0, 1.0,
         0.5,  0.5, -0.5, 1.0, 1.0,
        // Mặt trên
        -0.5,  0.5,  0.5, 0.0, 0.0,
         0.5,  0.5,  0.5, 1.0, 0.0,
        -0.5,  0.5, -0.5, 0.0, 1.0,
         0.5,  0.5, -0.5, 1.0, 1.0,
        // Mặt dưới
        -0.5, -0.5,  0.5, 0.0, 0.0,
         0.5, -0.5,  0.5, 1.0, 0.0,
        -0.5, -0.5, -0.5, 0.0, 1.0,
         0.5, -0.5, -0.5, 1.0, 1.0,
        // Mặt trái
        -0.5, -0.5,  0.5, 0.0, 0.0,
        -0.5,  0.5,  0.5, 0.0, 1.0,
        -0.5, -0.5, -0.5, 1.0, 0.0,
        -0.5,  0.5, -0.5, 1.0, 1.0,
        // Mặt phải
         0.5, -0.5,  0.5, 0.0, 0.0,
         0.5,  0.5,  0.5, 0.0, 1.0,
         0.5, -0.5, -0.5, 1.0, 0.0,
         0.5,  0.5, -0.5, 1.0, 1.0
    ]);
    return { vertices: vertices };
}

function initTexture(image) {
    texture = gl.createTexture();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler, 0);
}

function tick() {
    sphereAngle += 0.5;
    if (isCubeRotating) cubeAngle += 0.5;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    drawCube();
    drawSphere();
    requestAnimationFrame(tick);
}

function drawCube() {
    var cubeData = generateCube();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeData.vertices, gl.STATIC_DRAW);

    var FSIZE = cubeData.vertices.BYTES_PER_ELEMENT;
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 5, 0);
    gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, FSIZE * 5, FSIZE * 3);
    gl.enableVertexAttribArray(a_Position);
    gl.enableVertexAttribArray(a_texCoord);

    xformMatrix.setIdentity();
    xformMatrix.rotate(cubeAngle, 1.0, 1.0, 1.0);
    gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);

    if (isCubeTransparent) {
        gl.drawArrays(gl.LINES, 0, 24); // Vẽ khung dây
    } else if (textureLoaded) {
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);  // Mặt trước
        gl.drawArrays(gl.TRIANGLE_STRIP, 4, 4);  // Mặt sau
        gl.drawArrays(gl.TRIANGLE_STRIP, 8, 4);  // Mặt trên
        gl.drawArrays(gl.TRIANGLE_STRIP, 12, 4); // Mặt dưới
        gl.drawArrays(gl.TRIANGLE_STRIP, 16, 4); // Mặt trái
        gl.drawArrays(gl.TRIANGLE_STRIP, 20, 4); // Mặt phải
    } else {
        gl.drawArrays(gl.LINES, 0, 24); // Vẽ khung dây nếu texture chưa tải
    }
}

function drawSphere() {
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.bindBuffer(gl.ARRAY_BUFFER, sphereTexCoordBuffer);
    gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_texCoord);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIndexBuffer);

    xformMatrix.setIdentity();
    xformMatrix.translate(sphereX, sphereY, 0.0);
    xformMatrix.rotate(sphereAngle, 0.0, 1.0, 0.0);
    gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);

    gl.drawElements(gl.TRIANGLES, numLatitudeBands * numLongitudeBands * 6, gl.UNSIGNED_SHORT, 0);
}

// Hàm điều khiển
function startRotation() { isCubeRotating = true; }
function stopRotation() { isCubeRotating = false; }
function openCube() { isCubeTransparent = true; }
function wrapCube() { isCubeTransparent = false; }

function moveSphereLeft() {
    var newX = sphereX - 0.05;
    sphereX = newX; // Tịnh tiến sang trái mà không giới hạn
}

function moveSphereRight() {
    var newX = sphereX + 0.05;
    sphereX = newX; // Tịnh tiến sang phải mà không giới hạn
}

function moveSphereUp() {
    var newY = sphereY + 0.05;
    // Giới hạn để hình cầu không vượt quá biên trên của hình lập phương (0.5 - sphereRadius = 0.3)
    if (newY <= 0.5 - sphereRadius) sphereY = newY;
}

function moveSphereDown() {
    var newY = sphereY - 0.05;
    // Giới hạn để hình cầu không vượt quá biên dưới của hình lập phương (-0.5 + sphereRadius = -0.3)
    if (newY >= -0.5 + sphereRadius) sphereY = newY;
}

main();