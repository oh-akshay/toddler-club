// @ts-nocheck
// Minimal QR encoder returning a boolean matrix; trimmed for demo use.

type AnyObj = any;

function QR8bitByte(data) { this.mode = 4; this.data = data; }
QR8bitByte.prototype = { getLength: function(){ return this.data.length; }, write: function(buff){ for(let i=0;i<this.data.length;i++){ buff.put(this.data.charCodeAt(i),8); } } };

const QRErrorCorrectLevel = { M:0, L:1, H:2, Q:3 };

function QRMath() {}
QRMath.glog = function(n){ if(n<1) throw new Error("glog"); const LOG = QRMath.LOG||(QRMath.LOG=(function(){const l=new Array(256).fill(0); let p=1; for(let i=0;i<255;i++){ l[p]=i; p=(p<<1)^(p&0x80?0x1d:0);} return l;})()); return LOG[n]; };
QRMath.gexp = function(n){ const EXP = QRMath.EXP||(QRMath.EXP=(function(){const e=new Array(512).fill(0); let p=1; for(let i=0;i<255;i++){ e[i]=p; p=(p<<1)^(p&0x80?0x1d:0);} for(let i=255;i<512;i++) e[i]=e[i-255]; return e;})()); return EXP[n]; };

function QRPolynomial(num, shift){ this.num=(function(){ let offset=0; while(offset<num.length && num[offset]===0) offset++; const n = new Array(num.length-offset+shift).fill(0); for(let i=0;i<num.length-offset;i++) n[i]=num[i+offset]; return n; })(); }
QRPolynomial.prototype = { get length(){ return this.num.length; }, getAt:function(i){ return this.num[i]; }, multiply:function(e){ const num=new Array(this.length+e.length-1).fill(0); for(let i=0;i<this.length;i++){ for(let j=0;j<e.length;j++){ num[i+j]^=QRMath.gexp(QRMath.glog(this.getAt(i))+QRMath.glog(e.getAt(j))); } } return new QRPolynomial(num,0); }, mod:function(e){ if(this.length-e.length<0) return this; const ratio=QRMath.glog(this.getAt(0))-QRMath.glog(e.getAt(0)); const num=this.num.slice(); for(let i=0;i<e.length;i++){ num[i]^=QRMath.gexp(QRMath.glog(e.getAt(i))+ratio); } return new QRPolynomial(num,0).mod(e); } };

function QRRSBlock(totalCount, dataCount){ this.totalCount=totalCount; this.dataCount=dataCount; }
QRRSBlock.getRSBlocks = function(){ return [ new QRRSBlock(28, 22) ]; };

function QRBitBuffer(){ this.buffer=[]; this.length=0; }
QRBitBuffer.prototype = { get:function(i){ return ((this.buffer[Math.floor(i/8)]>>> (7 - i%8)) & 1) === 1; }, put:function(num,length){ for(let i=0;i<length;i++){ this.putBit(((num>>> (length - i - 1)) & 1)===1); } }, putBit:function(bit){ const bufIndex=Math.floor(this.length/8); if(this.buffer.length<=bufIndex){ this.buffer.push(0); } if(bit){ this.buffer[bufIndex] |= (0x80 >>> (this.length%8)); } this.length++; } };

export function createQRCode(text: string) {
  const typeNumber = 2;
  const ecLevel = QRErrorCorrectLevel.M;
  const dataList = [new QR8bitByte(text)];
  const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, ecLevel);
  let buffer = new QRBitBuffer();
  dataList.forEach((d) => { buffer.put(4,4); buffer.put(d.getLength(),8); d.write(buffer); });
  const totalDataCount = rsBlocks.reduce((a, b) => a + b.dataCount, 0);
  if (buffer.length + 4 <= totalDataCount * 8) buffer.put(0,4);
  while (buffer.length % 8 !== 0) buffer.putBit(false);
  while (Math.floor(buffer.length / 8) < totalDataCount) { buffer.put(0xec,8); if (Math.floor(buffer.length/8) < totalDataCount) buffer.put(0x11,8); }
  const data = new Array(totalDataCount).fill(0).map((_,i)=> buffer.buffer[i]||0);
  const moduleCount = 25;
  const modules = new Array(moduleCount).fill(null).map(()=>new Array(moduleCount).fill(false));
  const placeFinder = (row,col)=>{ for(let r=-1;r<=7;r++){ for(let c=-1;c<=7;c++){ const rr=row+r, cc=col+c; if(rr<0||rr>=moduleCount||cc<0||cc>=moduleCount) continue; const inside = (r>=0&&r<=6&&c>=0&&c<=6); const black = ( (r===0||r===6||c===0||c===6) || (r>=2&&r<=4&&c>=2&&c<=4) ); modules[rr][cc] = inside ? black : modules[rr][cc]; } } };
  placeFinder(0,0); placeFinder(0,moduleCount-7); placeFinder(moduleCount-7,0);
  let inc = -1; let row = moduleCount - 1; let bitIndex = 0; let byteIndex = 0;
  for (let col = moduleCount - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    while (true) {
      for (let c = 0; c < 2; c++) {
        const cc = col - c;
        if (modules[row][cc] !== false) continue;
        let dark = false;
        if (byteIndex < data.length) {
          dark = (((data[byteIndex] >>> (7 - bitIndex)) & 1) === 1);
        }
        modules[row][cc] = dark;
        bitIndex++;
        if (bitIndex === 8) { bitIndex = 0; byteIndex++; }
      }
      row += inc;
      if (row < 0 || row >= moduleCount) { row -= inc; inc = -inc; break; }
    }
  }
  return { count: moduleCount, isDark: (r:number,c:number)=> !!modules[r][c] };
}

