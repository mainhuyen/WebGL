var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec2 a_texCoord;\n'+
  'uniform mat4 u_xformMatrix;\n'+
  'varying vec2 v_texCoord;\n'+
  'void main() {\n' +
  '  gl_Position = u_xformMatrix * a_Position;\n' +
  '  v_texCoord = a_texCoord;\n'+
  '}\n';
var FSHADER_SOURCE =
  'precision mediump float;\n'+
  'varying vec2 v_texCoord;\n'+
  'uniform sampler2D u_Sampler;\n' +
  'void main() {\n' +  
  ' gl_FragColor = texture2D(u_Sampler, v_texCoord);\n' +
  '}\n';
function main() {
  var canvas = document.getElementById('webGL');
  var gl = getWebGLContext(canvas);
  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)
  var n = initVertexBuffers(gl);
  var u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix');
  var xformMatrix = new Matrix4();
  xformMatrix.setRotate(30, 1, 1, 1);
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 1);
  var texture = gl.createTexture();
  var image = new Image();
 
  var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
  image.onload = function(){
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); 
	gl.activeTexture(gl.TEXTURE0);// Enable the texture unit 0
	gl.bindTexture(gl.TEXTURE_2D, texture);
	// Set the texture parameters
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	// Set the texture image
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
	// Set the texture unit 0 to the sampler
	gl.uniform1i(u_Sampler, 0);
	gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
	 gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	 gl.drawArrays(gl.TRIANGLE_STRIP, 4, 4);
	 gl.drawArrays(gl.TRIANGLE_STRIP, 8, 4);
	 gl.drawArrays(gl.TRIANGLE_STRIP, 12, 4);
	 gl.drawArrays(gl.TRIANGLE_STRIP, 16, 4);
	 gl.drawArrays(gl.TRIANGLE_STRIP, 20, 4);
  }
  image.src = "crate.gif";
  gl.clear(gl.COLOR_BUFFER_BIT);
	 
  //gl.drawArrays(gl.POINTS, 0, n);
}
function initVertexBuffers(gl) {
  var Hoimon = new Float32Array([
      //front face
	-0.5,  0.5,  0.5, 0.0, 1.0,	    
	-0.5, -0.5,  0.5, 0.0, 0.0,
	 0.5,  0.5,  0.5, 1.0, 1.0,
	 0.5, -0.5,  0.5, 1.0, 0.0,
  // Back face
  -0.5,  0.5, -0.5, 0.0, 1.0,
  -0.5, -0.5, -0.5, 0.0, 0.0,
   0.5,  0.5, -0.5, 1.0, 1.0,
   0.5, -0.5, -0.5, 1.0, 0.0, 

  // Top face
  -0.5,  0.5,  0.5, 0.0, 1.0,
  -0.5,  0.5, -0.5, 0.0, 0.0,
   0.5,  0.5,  0.5, 1.0, 1.0,
   0.5,  0.5, -0.5, 1.0, 0.0,   

  // Bottom face
  -0.5, -0.5,  0.5, 0.0, 1.0,
  -0.5, -0.5, -0.5, 0.0, 0.0,
   0.5, -0.5,  0.5, 1.0, 1.0,
   0.5, -0.5, -0.5, 1.0, 0.0,
   
  // Right face
   0.5, -0.5,  0.5, 0.0, 0.0,//v0
   0.5, -0.5, -0.5, 1.0, 0.0,//v1
   0.5,  0.5,  0.5, 0.0, 1.0,//v2
   0.5,  0.5, -0.5, 1.0, 1.0,//v3   

  // Left face
  -0.5, -0.5,  0.5, 0.0, 1.0,	
  -0.5, -0.5, -0.5, 0.0, 0.0,
  -0.5,  0.5,  0.5, 1.0, 1.0,
  -0.5,  0.5, -0.5, 1.0, 0.0,
  ]);
  var FSIZE = Hoimon.BYTES_PER_ELEMENT;
  var n = 24; 
  var Bom = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, Bom);
  gl.bufferData(gl.ARRAY_BUFFER, Hoimon, gl.STATIC_DRAW);
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  var a_texCoord = gl.getAttribLocation(gl.program, 'a_texCoord');
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE*5, 0);
  gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, FSIZE*5,FSIZE*3); 
  gl.enableVertexAttribArray(a_Position);
  gl.enableVertexAttribArray(a_texCoord);
  return n;
}
//=======

