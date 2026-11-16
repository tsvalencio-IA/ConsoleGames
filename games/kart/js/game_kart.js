// =============================================================================
// KART LEGENDS: TITANIUM MASTER FINAL V23 (COMBATE REALISTA, ECONOMIA E FÍSICA)
// ARQUITETO: SENIOR GAME ENGINE ARCHITECT
// Copas sincronizadas, direção por câmera e física nativa do kart.
// =============================================================================

(function() {

    // -----------------------------------------------------------------
    // 1. DADOS E CONFIGURAÇÕES
    // -----------------------------------------------------------------
    const AI_DIFFICULTY_SETTINGS = {
        'EASY':   { speedMult: 0.90, accelMult: 0.9,  reaction: 0.05, lookAhead: 15, errorRate: 0.08, rubberBand: 0.0 },
        'MEDIUM': { speedMult: 1.05, accelMult: 1.1,  reaction: 0.10, lookAhead: 25, errorRate: 0.05, rubberBand: 0.2 },
        'HARD':   { speedMult: 1.25, accelMult: 1.4,  reaction: 0.25, lookAhead: 40, errorRate: 0.02, rubberBand: 0.4 } 
    };
    
    const CURRENT_DIFFICULTY = 'MEDIUM';
    const playOptions=()=>window.ArcadePlaySettings?.get()||{distance:'far',sensitivity:1,autoAccelerate:false,difficulty:'normal',steeringAssist:'light'};
    const STEERING_ASSISTS={off:{label:'Desligada',curve:0,edge:0},light:{label:'Leve',curve:.25,edge:.002},medium:{label:'Média',curve:.50,edge:.005},high:{label:'Forte',curve:.75,edge:.010}};

    const CHARACTERS = [
        { id: 0, name: 'ASTRO',  color: '#e74c3c', hat: '#d32f2f', speedInfo: 1.00, turnInfo: 1.00, weight: 1.0, ac���q�^