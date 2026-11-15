// HillsMidlineGenerator (class xt from Slow Roads)
// Extends RoadSurveyor with dynamic banking calculation, road markings (solid vs dashed lines),
// and fine subdivision between road anchor nodes.

import { RoadSurveyor, MidlineState } from './roadSurveyor.js';
import { PerlinNoise } from './perlin.js';

Math.TAU = Math.PI * 2;
const B = RoadSurveyor;
const c = MidlineState;

const h = (target, prop, value) => {
  target[prop] = value;
  return value;
};

// Shadow density helper dummy for standalone execution
class ShadowDensityHelper {
  getShadowDensityAt(x, z) {
    return 0;
  }
}
const D = new ShadowDensityHelper();
const e = {};
const A = 5;
const u = 2;
let f = 6;
let T = 3;
const C = 9;
const ft = 0.8; // Banking multiplier
const x = 4; // Half-width road offset for shadow rays

const pt = new PerlinNoise({
  scale: 1,
  offset: 0.5,
  resolution: 5,
  depth: 3,
  upscale: 3,
  tileSize: 400,
  spiralise: false,
  repeated: true
});

export class HillsMidlineGenerator extends RoadSurveyor {
constructor(...t){super(...t);h(this,"tmn");h(this,"markingsNode");h(this,"markingsAbsDa",0);h(this,"markingsDa",0);h(this,"markingsGradLat",0);h(this,"markingsGradLonDiff",0);h(this,"markingsTrees",0);h(this,"prevGradLonDiff",0);h(this,"prevMarkingsDa",0);h(this,"prevSolidLeftSeg",{start:null,end:null});h(this,"prevSolidRightSeg",{start:null,end:null});h(this,"hasSolidLineLeft",!1);h(this,"hasSolidLineRight",!1);h(this,"solidLineLeftExtensions",0);h(this,"solidLineRightExtensions",0);h(this,"solidLineRightPrepend",T);h(this,"solidLineExtensions",T)}initialise(t,a){super.initialise(t,a);let d=Object.keys(e);for(let r of d)delete e[r];this.markingsNode=c.head,f=this.config.markingsMargin??6,T=f/2}makeHeadNode(){super.makeHeadNode(),c.head.blend=0,this.markingsNode=c.head}extendMidline(){var t;if(super.extendMidline()){if(!c.tail.blend){let a=c.tail;a.blend=1-Math.min(Math.max(0,pt.getXZ(a.p.x,a.p.z)),1)**2,a.bridge&&(a.blend*=.1),(t=a.prev)!=null&&t.blend&&(a.blend=a.prev.blend*.5+a.blend*.5)}return!0}return!1}extendFine(){if(super.extendFine(),!!c.fineTail.prev){if(e.n=c.fineTail.prev,e.n.shadowLeft?e.n.shadowLeft=Math.max(e.n.shadowLeft,D.getShadowDensityAt(e.n.p.x-e.n.n.x*x,e.n.p.z-e.n.n.z*x)):e.n.shadowLeft=D.getShadowDensityAt(e.n.p.x-e.n.n.x*x,e.n.p.z-e.n.n.z*x),e.n.shadowRight?e.n.shadowRight=Math.max(e.n.shadowRight,D.getShadowDensityAt(e.n.p.x+e.n.n.x*x,e.n.p.z+e.n.n.z*x)):e.n.shadowRight=D.getShadowDensityAt(e.n.p.x+e.n.n.x*x,e.n.p.z+e.n.n.z*x),e.th=e.n.p.y-e.n.h,e.th<A?(e.tgLeft=1,e.tgRight=1,e.n.g<0?e.tgLeft=Math.max(0,1-e.n.g/-u):e.tgRight=Math.max(0,1-e.n.g/u),e.n.shadowLeft*=Math.min(e.th/A,e.tgLeft),e.n.shadowRight*=Math.min(e.th/A,e.tgRight)):e.g<-u?e.n.shadowLeft*=Math.max(0,(e.g+u)/u):e.g>u&&(e.n.shadowRight*=Math.max(0,(e.g-u)/u)),e.n.bridge&&(e.n.shadowLeft*=0,e.n.shadowRight*=0),e.n.prev&&e.n.prev.fs>0)for(e.nn=e.n.prev.nextFine,e.fs=e.n.prev.fs+1,e.i=1;e.i<e.fs;e.i++)e.l=e.i/e.fs,e.nn.shadowLeft=e.n.shadowLeft*e.l+e.n.prev.shadowLeft*(1-e.l),e.nn.shadowRight=e.n.shadowRight*e.l+e.n.prev.shadowRight*(1-e.l),e.nn=e.nn.nextFine;this.updateMarkings()}}updateMarkings(){var y,E;let t=c.fineTail?c.fineTail.prev:null;if(!t||!this.markingsNode)return;if(this.markingsDa+=t.da,this.markingsAbsDa+=Math.abs(t.da),this.markingsGradLat+=t.g,this.markingsTrees+=Math.min(t.shadowLeft,t.shadowRight),this.markingsNode.i>t.i-f+1)return;let a=this.config.solidLineThreshold,d=this.markingsTrees/f,r=this.markingsGradLat/f;Math.abs(r)<.5||Math.sign(r)!=Math.sign(this.markingsDa)?r=0:(r=Math.abs(r),r<.5?r=0:r=Math.min(1,(r-.5)*2));const k=this.config.solidLineCrestThreshold;if(Math.sign(t.gf)==Math.sign(this.markingsNode.gf))this.markingsGradLonDiff=0;else{this.markingsGradLonDiff=t.gf-this.markingsNode.gf;let o=Math.abs(t.gf)/(Math.abs(t.gf)+Math.abs(this.markingsNode.gf));o=Math.abs(o-.5)*2,this.markingsGradLonDiff*=1-o}let p=this.markingsGradLonDiff*.3+.7*this.prevGradLonDiff;this.prevGradLonDiff=p;let S=p/k,M=Math.max(d,r,S);M*=1+Math.min(1,S),a*=1-M*.5;let L=a*(1-this.markingsDa/f*4*M),v=a*(1+this.markingsDa/f*4*M),m=Math.abs(this.markingsDa/f)*.75+.25*this.prevMarkingsDa;if(this.prevMarkingsDa=m,this.markingsNode.paintSolidLeftWeight=0,m>L){if(this.markingsNode.paintSolidLeftWeight=1,this.solidLineLeftExtensions=f,this.solidLineLeftExtensions-=2,!this.hasSolidLineLeft){this.hasSolidLineLeft=!0;let o=T;if(L==0&&(o+=2),this.prevSolidLeftSeg.end&&this.markingsNode.i-this.prevSolidLeftSeg.end.i<C+o)for(;this.prevSolidLeftSeg.end.i<this.markingsNode.i;)this.prevSolidLeftSeg.end=this.prevSolidLeftSeg.end.next,this.prevSolidLeftSeg.end.paintSolidLeftWeight=1;else{this.prevSolidLeftSeg.start=this.markingsNode;let g=this.markingsNode.prev;for(;g&&g.i>this.markingsNode.i-o;)g.paintSolidLeftWeight=1,g.i<this.prevSolidLeftSeg.start&&(this.prevSolidLeftSeg.start=g),g=g.prev;g=(E=(y=g==null?void 0:g.prev)==null?void 0:y.prev)==null?void 0:E.prev,g&&(g.paintMergeLeft=!0)}this.prevSolidLeftSeg.end=this.markingsNode}}else if(this.hasSolidLineLeft){this.markingsNode.paintSolidLeftWeight=1,this.prevSolidLeftSeg.end=this.markingsNode;let o=L*.6;m<o&&(this.solidLineLeftExtensions--,m<o*.5&&this.solidLineLeftExtensions--,this.solidLineLeftExtensions<=0&&(this.hasSolidLineLeft=!1))}if(this.markingsNode.paintSolidRightWeight=0,m>v)if(this.markingsNode.paintSolidRightWeight=1,this.solidLineRightExtensions=f+1,this.hasSolidLineRight)this.markingsNode.paintSolidRightWeight=1;else{if(this.hasSolidLineRight=!0,this.prevSolidRightSeg.end&&this.markingsNode.i-this.prevSolidRightSeg.end.i<C)for(;this.prevSolidRightSeg.end.i<this.markingsNode.i;)this.prevSolidRightSeg.end=this.prevSolidRightSeg.end.next,this.prevSolidRightSeg.end.paintSolidRightWeight=1;else{if(this.prevSolidRightSeg.end){let o=this.prevSolidRightSeg.end.next.next.next;o&&(o.paintMergeRight=!0)}this.prevSolidRightSeg.start=this.markingsNode}this.prevSolidRightSeg.end=this.markingsNode}else if(this.hasSolidLineRight){this.markingsNode.paintSolidRightWeight=1,this.prevSolidRightSeg.end=this.markingsNode;let o=v*.6;m<o&&(this.solidLineRightExtensions--,this.solidLineRightExtensions<=0&&(this.hasSolidLineRight=!1))}this.markingsDa-=this.markingsNode.da,this.markingsAbsDa-=Math.abs(this.markingsNode.da),this.markingsGradLat-=this.markingsNode.g,this.markingsTrees-=Math.min(this.markingsNode.shadowLeft,this.markingsNode.shadowRight),this.markingsNode=this.markingsNode.next}smoothHeight(){super.smoothHeight();let t=this.smoothWindowHead.prev;if(t.prev&&!t.prev.bridge&&!t.bridge&&!t.next.bridge){let a=t.next.a-t.prev.a;a>Math.PI?a-=Math.TAU:a<-Math.PI&&(a+=Math.TAU),t.bank=a*ft,t.bank=t.bank*.5+t.prev.bank*.5}else t.bank=0}}
export default HillsMidlineGenerator;
