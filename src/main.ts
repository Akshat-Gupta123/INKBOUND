import Phaser from 'phaser';
import {Book} from './game';
import './style.css';
const game=new Phaser.Game({type:Phaser.CANVAS,parent:'game',width:1280,height:720,backgroundColor:'#15191c',antialias:true,physics:{default:'arcade',arcade:{gravity:{x:0,y:1650},debug:false,fps:60}},scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[Book],audio:{noAudio:true}});
// Expose the actual scene for deterministic browser acceptance tests and level tooling.
Object.assign(window,{inkbound:game});
