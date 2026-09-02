/* ═══ ESTADO DE LA SESIÓN ═══
   Un solo objeto mutable compartido por los dos módulos.
   `restart()` en app.js es el único punto que lo reinicia por completo. */

let TEAM_NAME = '';
let ST = { country:null, perfil:null, meta:null };
let COMBO_TOOLS = [];
let BUILDER_SEL = {};
let BUILDER2_SEL = {};

function resetState(){
  TEAM_NAME = '';
  ST = { country:null, perfil:null, meta:null };
  COMBO_TOOLS = [];
  BUILDER_SEL = {};
  BUILDER2_SEL = {};
}
