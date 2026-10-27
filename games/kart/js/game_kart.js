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
        { id: 0, name: 'ASTRO',  color: '#e74c3c', hat: '#d32f2f', speedInfo: 1.00, turnInfo: 1.00, weight: 1.0, accel: 0.040, aggression: 0.6 },
        { id: 1, name: 'NEON',  color: '#2ecc71', hat: '#27ae60', speedInfo: 1.05, turnInfo: 0.90, weight: 1.0, accel: 0.038, aggression: 0.5 },
        { id: 2, name: 'LUMI',  color: '#ff9ff3', hat: '#fd79a8', speedInfo: 0.98, turnInfo: 1.15, weight: 0.8, accel: 0.055, aggression: 0.3 },
        { id: 3, name: 'ATLAS', color: '#f1c40f', hat: '#e67e22', speedInfo: 1.15, turnInfo: 0.70, weight: 1.6, accel: 0.025, aggression: 0.95 },
        { id: 4, name: 'PIPO',   color: '#3498db', hat: '#ecf0f1', speedInfo: 0.92, turnInfo: 1.25, weight: 0.6, accel: 0.070, aggression: 0.4 },
        { id: 5, name: 'BOLT',  color: '#76ff03', hat: '#64dd17', speedInfo: 1.02, turnInfo: 1.10, weight: 0.9, accel: 0.045, aggression: 0.5 },
        { id: 6, name: 'ROCHA',     color: '#795548', hat: '#5d4037', speedInfo: 1.12, turnInfo: 0.80, weight: 1.5, accel: 0.030, aggression: 0.9 },
        { id: 7, name: 'VÓRTEX',  color: '#ffeb3b', hat: '#fbc02d', speedInfo: 1.08, turnInfo: 0.85, weight: 1.5, accel: 0.032, aggression: 0.95 }
    ];

    const KART_MODELS = [
        { id: 0, name: 'KART PADRÃO', type: 'standard', price: 0, speedBonus: 0.0, turnBonus: 0.0, weightBonus: 0.0, color: '#bdc3c7', desc: 'Kart equilibrado de fábrica.' },
        { id: 1, name: 'FÓRMULA 1', type: 'f1', price: 2000, speedBonus: 0.25, turnBonus: -0.05, weightBonus: 0.1, color: '#e74c3c', desc: 'Velocidade extrema no asfalto.' },
        { id: 2, name: 'CARRO DE LUXO', type: 'luxury', price: 3000, speedBonus: 0.10, turnBonus: 0.05, weightBonus: 0.3, color: '#2c3e50', desc: 'Elegância, Peso e Estabilidade.' },
        { id: 3, name: 'MOTO SUPER', type: 'moto', price: 1500, speedBonus: 0.15, turnBonus: 0.30, weightBonus: -0.4, color: '#2ecc71', desc: 'Curvas fechadas, muito leve.' },
        { id: 4, name: 'TRATOR', type: 'tractor', price: 3500, speedBonus: -0.10, turnBonus: 0.15, weightBonus: 0.8, color: '#f1c40f', desc: 'Ignora offroad, amassa os rivais.' },
        { id: 5, name: 'TANQUE MILITAR', type: 'tank', price: 6000, speedBonus: -0.15, turnBonus: -0.10, weightBonus: 1.5, color: '#4b6584', desc: 'Blindado. Cascos não fazem cócegas.' },
        { id: 6, name: 'AVIÃO JATO', type: 'plane', price: 8000, speedBonus: 0.40, turnBonus: 0.05, weightBonus: -0.2, color: '#ffffff', desc: 'Praticamente voa sobre a pista!' }
    ];

    const TRACKS = [
        { id: 0, name: 'CIRCUITO SOLAR', theme: 'grass', sky: 0, curveMult: 1.0 },
        { id: 1, name: 'DUNAS DO VENTO', theme: 'sand', sky: 1, curveMult: 0.8 },
        { id: 2, name: 'MONTANHA GELADA', theme: 'snow', sky: 2, curveMult: 1.3 }
    ];

    const CONF = {
        MAX_SPEED: 235, TURBO_MAX_SPEED: 350, FRICTION: 0.98, OFFROAD_DECEL: 0.92, ROAD_WIDTH: 2000,
        SEGMENT_LENGTH: 200, DRAW_DISTANCE: 300, RUMBLE_LENGTH: 3, TOTAL_LAPS: 3,
        CAMERA_LERP: 0.08, CAMERA_DEPTH: 1.0 
    };

    const SAFETY = { ZOMBIE_TIMEOUT: 15000, MAX_RACE_TIME: 300000, MAINTENANCE_RATE: 2000 };
    const PHYSICS = { gripAsphalt: 0.98, gripZebra: 0.85, gripOffroad: 0.55, steerSensitivity: 0.30, lateralSpeed: 0.026, maxLateralSpeed: 0.040 };
    // Body/wheel extents in drawKartSprite coordinates, converted by the same
    // sprite-to-road scale as renderWorld. Shadows are not collision surfaces.
    const KART_BODY_HALF_WIDTH = [62, 71, 68, 34, 55, 45, 60];
    const kartHalfWidth = modelId => (KART_BODY_HALF_WIDTH[modelId] || KART_BODY_HALF_WIDTH[0]) * .0022 * 1.55 / 1.5;

    const KartAudio={initialized:false,isPlaying:false,voice:null,init(){this.initialized=!!window.GameAudio?.vehicleVoice;window.GameAudio?.unlock?.();},start(){if(this.isPlaying)return;this.init();this.voice=window.GameAudio?.vehicleVoice?.('kart','kart');this.isPlaying=!!this.voice;},stop(){this.voice?.dispose();this.voice=null;this.isPlaying=false;},update(speed,maxSpeed,driftIntensity,isOffroad,isTurbo){this.voice?.update(Math.abs(speed)/Math.max(1,maxSpeed)*24,speed>0?.8:0,isTurbo,!window.System?.paused);},crash(){window.GameAudio?.effect?.('impact');}};

    let segments = []; let trackLength = 0; let minimapPath = []; let minimapBounds = {minX:0, maxX:0, minZ:0, maxZ:0, w:1, h:1};
    let hudMessages = []; let particles = []; let nitroBtn = null; let resetBtn = null; 
    const DUMMY_SEG = { curve: 0, y: 0, color: 'light', obs: [], theme: 'grass' };

    function getSegment(index) { if (!segments || segments.length === 0) return DUMMY_SEG; const len = segments.length; const i = ((Math.floor(index) % len) + len) % len; return segments[i] || DUMMY_SEG; }

    function buildMiniMap(segments) {
        minimapPath = []; let x = 0, z = 0, angle = 0;
        segments.forEach(seg => { angle -= seg.curve * 0.04; x += Math.sin(angle) * 8; z -= Math.cos(angle) * 8; minimapPath.push({ x, z }); });
        let minX=Infinity, maxX=-Infinity, minZ=Infinity, maxZ=-Infinity;
        minimapPath.forEach(p => { if(p.x < minX) minX = p.x; if(p.x > maxX) maxX = p.x; if(p.z < minZ) minZ = p.z; if(p.z > maxZ) maxZ = p.z; });
        minimapBounds = { minX, maxX, minZ, maxZ, w: maxX-minX || 1, h: maxZ-minZ || 1 };
    }

    function drawCharacterHead(ctx, charId, steer) {
        const stats = CHARACTERS[charId] || CHARACTERS[0]; const n = stats.name;
        ctx.save(); ctx.rotate(steer * 0.3);
        
        if (n === 'ROCHA') {
            ctx.translate(0, -15);
            ctx.fillStyle = '#4e342e'; ctx.beginPath(); ctx.ellipse(0, -20, 28, 30, 0, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.moveTo(-15, -45); ctx.lineTo(0, -65); ctx.lineTo(15, -45); ctx.fill();
            ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.moveTo(-8, -10); ctx.lineTo(8, -10); ctx.lineTo(0, 15); ctx.fill();
        } 
        else if (n === 'ATLAS') {
            ctx.translate(0, -5);
            ctx.fillStyle = '#27ae60'; ctx.beginPath(); ctx.ellipse(0, -25, 45, 50, 0, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = '#ecf0f1'; ctx.lineWidth = 8; ctx.stroke(); 
            ctx.fillStyle = '#ecf0f1'; const drawSpike = (sx, sy) => { ctx.beginPath(); ctx.arc(sx, sy, 10, 0, Math.PI*2); ctx.fill(); }; drawSpike(0, -55); drawSpike(-25, -30); drawSpike(25, -30); drawSpike(0, -10);
            ctx.fillStyle = '#e67e22'; ctx.beginPath(); ctx.ellipse(0, -75, 20, 15, 0, 0, Math.PI*2); ctx.fill();
        }
        else if (n === 'BOLT') {
            ctx.translate(0, -10);
            ctx.fillStyle = '#76ff03'; ctx.beginPath(); ctx.ellipse(0, -20, 20, 30, 0, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.ellipse(0, -10, 14, 10, 0, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.moveTo(-6, -45); ctx.lineTo(0, -55); ctx.lineTo(6, -45); ctx.fill(); ctx.beginPath(); ctx.moveTo(-5, -30); ctx.lineTo(0, -40); ctx.lineTo(5, -30); ctx.fill();
        }
        else if (n === 'LUMI') {
            ctx.translate(0, -10);
            ctx.fillStyle = '#ff9ff3'; ctx.beginPath(); ctx.ellipse(0, -15, 22, 25, 0, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.moveTo(-18, -45); ctx.lineTo(18, -45); ctx.lineTo(22, -10); ctx.lineTo(-22, -10); ctx.fill(); ctx.fillStyle = '#f39c12'; ctx.beginPath(); ctx.moveTo(-12, -45); ctx.lineTo(-18, -60); ctx.lineTo(-5, -50); ctx.lineTo(0, -65); ctx.lineTo(5, -50); ctx.lineTo(18, -60); ctx.lineTo(12, -45); ctx.fill(); ctx.fillStyle = '#3498db'; ctx.beginPath(); ctx.arc(0, -55, 3, 0, Math.PI*2); ctx.fill();
        }
        else if (n === 'VÓRTEX') {
            ctx.translate(0, -10);
            ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.ellipse(0, -15, 32, 25, 0, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#8e44ad'; ctx.fillRect(-22, -25, 8, 25); ctx.fillRect(14, -25, 8, 25); ctx.strokeStyle = '#000'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-25, -35); ctx.lineTo(-35, -32); ctx.lineTo(-40, -38); ctx.stroke(); ctx.beginPath(); ctx.moveTo(25, -35); ctx.lineTo(35, -32); ctx.lineTo(40, -38); ctx.stroke(); ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.ellipse(0, -42, 20, 15, 0, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, -37, 28, 6, 0, 0, Math.PI*2); ctx.fill();
        }
        else if (n === 'PIPO') {
            ctx.translate(0, -10);
            ctx.fillStyle = '#3498db'; ctx.fillRect(-12, -15, 24, 15); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, -35, 32, 22, 0, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.ellipse(0, -40, 12, 8, 0, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(-22, -30, 8, 12, 0, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(22, -30, 8, 12, 0, 0, Math.PI*2); ctx.fill();
        }
        else {
            ctx.translate(0, -10);
            ctx.fillStyle = stats.color; ctx.beginPath(); ctx.ellipse(0, -15, 18, 20, 0, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#2980b9'; ctx.fillRect(-12, -25, 6, 25); ctx.fillRect(6, -25, 6, 25); ctx.fillRect(-15, -5, 30, 10); ctx.fillStyle = stats.hat; ctx.beginPath(); ctx.ellipse(0, -35, 18, 15, 0, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, -30, 22, 6, 0, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.fillText(n[0], 0, -10);
        }
        ctx.restore();
    }

    const Logic = {
        get networkId(){return this.peerId||window.System?.playerId||'local';},
        networkNow(){return Date.now()+(this.serverClockOffset||0);},
        liveHumans(data=this.remotePlayersData||{}){return Object.keys(data).filter(id=>!id.startsWith('bot_')&&(!this.clockReady||id===this.networkId||this.networkNow()-Number(data[id]?.lastSeen||0)<SAFETY.ZOMBIE_TIMEOUT)).sort();},
        networkWrite(task){try{return Promise.resolve(task()).catch(error=>{window.System?.msg('Não foi possível atualizar a sala. Confira sua conexão e conta.');console.warn('Kart network:',error?.code||'connection');});}catch(error){window.System?.msg('Não foi possível conectar à sala.');return Promise.resolve();}},
        state: 'MODE_SELECT', raceState: 'LOBBY', roomId: 'mario_arena_titanium_v8', selectedChar: 0, selectedTrack: 0, isReady: false, isOnline: false, isHost: false,
        dbRef: null, roomRef: null, lastSync: 0, totalRacers: 0, remotePlayersData: {}, localBots: [], maintenanceInterval: null,
        speed: 0, pos: 0, playerX: 0, steer: 0, targetSteer: 0, cameraX: 0, nitro: 100, turboLock: false, gestureTimer: 0, spinAngle: 0, spinTimer: 0, lateralInertia: 0, vibration: 0, engineTimer: 0,
        driftSparks: 0, slipstreamTimer: 0, lap: 1, maxLapPos: 0, status: 'RACING', finishTime: 0, finalRank: 0, score: 0, visualTilt: 0, bounce: 0, skyColor: 0, inputActive: false, virtualWheel: { x:0, y:0, r:60, opacity:0, isHigh: false }, rivals: [], 
        
        currentFase: null, matchCoins: 0, cupPoints: 0,
        item: null, itemCooldown: 0, projectiles: [],

        useCustomKart: false, kartUpgrades: {}, shopHitboxes: [], lobbyHitboxes: [], 
        garage: [{ modelId: 0 }], activeKartIdx: 0, shopTab: 'SHOP', shopCarouselIdx: 0,

        init: function(faseData) { 
            this.cleanup();this.onlineCup=null;this.onlineCupOutcome=null;this.onlineResultConfirmed=false;this.networkPaused=false;this.cupActionPending=false;this.waitingForNextCup=false;this.previewTrack=null;this.confirmedOnlineMatch='';this.peerId='';this.lastStartedMatch='';this.clockReady=false;this.serverClockOffset=0;this.state = 'MODE_SELECT'; this.setupUI(); this.resetPhysics(); KartAudio.init();
            this.currentFase = faseData || { id: 'arcade', mode: 'RACE', targetRank: 3, trackId: 0, diff: 'MEDIUM' }; 
            this.cupPoints = 0; // Reset na Copa ao iniciar a Fase

            if (window.Profile) {
                if (!window.Profile.kartSave) window.Profile.kartSave = { garage: [{ modelId: 0 }], activeKartIdx: 0, upgrades: { engine: 1, tires: 1, suspension: 1 } };
                this.garage = window.Profile.kartSave.garage || [{ modelId: 0 }];
                this.activeKartIdx = window.Profile.kartSave.activeKartIdx || 0;
                this.kartUpgrades = window.Profile.kartSave.upgrades || { engine: 1, tires: 1, suspension: 1 };
            } else {
                this.garage = [{ modelId: 0 }];
                this.activeKartIdx = 0;
                this.kartUpgrades = { engine: 1, tires: 1, suspension: 1 };
            }
            this.useCustomKart=!!window.Profile?.kartSave?.useCustomKart;
        },

        cleanup: function() {
            document.body?.classList?.remove('kart-racing');
            const ref=this.roomRef,id=this.peerId;if(this.isOnline)this.checkpointOnlineRace();this.roomRef=this.dbRef=null;this.isOnline=this.isHost=false;
            if(ref){try{for(const path of ['players','cup','trackId','shared/hazards','shared/shells','shared/impacts','host'])ref.child(path).off();if(id){const own=ref.child('players/'+id);Promise.resolve(own.remove()).catch(()=>{});Promise.resolve(own.onDisconnect().cancel()).catch(()=>{});}}catch{}}
            try{this.clockRef?.off();}catch{}this.clockRef=null;
            if(this.maintenanceInterval)clearInterval(this.maintenanceInterval);this.maintenanceInterval=null;if(this.finishTimer)clearTimeout(this.finishTimer);this.finishTimer=null;
            if(nitroBtn)nitroBtn.remove();if(resetBtn)resetBtn.remove();
            KartAudio.stop();window.System.canvas.onpointerdown=null;
        },

        resetPhysics: function() {
            this.lastTime=performance.now();this.physicsAccumulator=0;this.collisionContacts=new Set();this.roadCurve=0;this.steeringHelp=0;this.trackingLost=false;this.turboLock=false;this.gestureTimer=0;
            this.virtualWheel={x:0,y:0,r:60,opacity:0,isHigh:false};this.cameraItemGesture=null;this.seenOnlineImpacts=new Set();
            this.speed = 0; this.pos = 0; this.playerX = 0; this.steer = 0; this.targetSteer = 0; this.cameraX = 0; this.driftSparks = 0; this.driftBoosts=0; this.slipstreamTimer = 0;
            this.lap = 1; this.maxLapPos = 0; this.status = 'RACING'; this.finishTime = 0; this.finalRank = 0; this.score = 0; this.nitro = 100; this.spinAngle = 0; this.spinTimer = 0; this.lateralInertia = 0; this.vibration = 0; this.engineTimer = 0; this.inputActive = false; this.rivals = []; this.localBots = []; particles = []; hudMessages = []; this.remotePlayersData = {};
            this.matchCoins = 0; this.item = null; this.itemCooldown = 0; this.projectiles = [];
            
            // --- INJEÇÃO DO CHAT GPT: PASSO 1 & 2 ---
            this.player = { lap: 1, position: 1, finished: false };
            this.totalLaps = CONF.TOTAL_LAPS;
            this.raceState = "RUNNING"; 
            this.reward = 0;
            // ----------------------------------------
        },

        pushMsg: function(text, color='#fff', size=40) { hudMessages.push({ text, color, size, life: 90, scale: 0.1 }); },

        requestTurbo: function() {
            if(this.state!=='RACE'||this.status!=='RACING'||this.turboLock)return false;
            const manual=window.ArcadeControls?.mode==='controls'?this.arcadeManual:null;
            const accelerating=manual?!!(manual.throttle||playOptions().autoAccelerate)&&!manual.brake:this.inputActive&&!this.trackingLost;
            if(!accelerating){this.pushMsg(manual?'SEGURE ACELERAR':'MOSTRE AS DUAS MÃOS À CÂMERA','#fff',24);return false;}
            if(this.nitro<20){this.pushMsg('NITRO CARREGANDO...','#f90',24);return false;}
            this.turboLock=true;window.Sfx.play(600,'square',.1,.1);this.pushMsg('TURBO!','#0ff');return true;
        },

        setupUI: function() {
            if(nitroBtn) nitroBtn.remove();
            nitroBtn = document.createElement('div'); nitroBtn.id = 'nitro-btn-kart'; nitroBtn.innerHTML = "NITRO";
            Object.assign(nitroBtn.style, { position: 'absolute', bottom: '15%', right: '30px', width: '85px', height: '85px', borderRadius: '50%', background: 'radial-gradient(#ffcc00, #ff6600)', border: '4px solid #fff', color: '#fff', display: 'none', alignItems: 'center', justifyContent: 'center', fontFamily: "'Russo One', sans-serif", fontWeight: "bold", fontSize: '14px', zIndex: '100', cursor: 'pointer', userSelect: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' });
            
            if(resetBtn) resetBtn.remove();
            resetBtn = document.createElement('div'); resetBtn.id = 'reset-btn-kart'; resetBtn.innerHTML = "RESET SALA";
            Object.assign(resetBtn.style, { position: 'absolute', top: '10px', left: '10px', width: '100px', height: '40px', borderRadius: '5px', background: '#c0392b', border: '2px solid #fff', color: '#fff', display: 'none', alignItems: 'center', justifyContent: 'center', fontFamily: "'Russo One', sans-serif", fontSize: '12px', zIndex: '101', cursor: 'pointer', userSelect: 'none' });

            nitroBtn.addEventListener('pointerdown', e=>{e.preventDefault();this.requestTurbo();});
            
            resetBtn.addEventListener('mousedown', (e)=>{ 
                e.preventDefault(); 
                if(this.state === 'LOBBY' && this.isOnline && this.roomRef) { 
                    this.roomRef.update({ raceState: 'LOBBY', totalRacers: 0, raceStartTime: 0, 'shared/hazards': null }); 
                    window.System.msg("SALA RESETADA COM SUCESSO!"); 
                    this.pushMsg("SALA RESETADA!", "#0f0", 50);
                }
            });
            resetBtn.addEventListener('touchstart', (e)=>{ 
                e.preventDefault(); 
                if(this.state === 'LOBBY' && this.isOnline && this.roomRef) { 
                    this.roomRef.update({ raceState: 'LOBBY', totalRacers: 0, raceStartTime: 0, 'shared/hazards': null }); 
                    window.System.msg("SALA RESETADA COM SUCESSO!"); 
                    this.pushMsg("SALA RESETADA!", "#0f0", 50);
                }
            });
            
            document.getElementById('game-ui').appendChild(nitroBtn); document.getElementById('game-ui').appendChild(resetBtn);

            window.System.canvas.onpointerdown = (e) => {
                const rect = window.System.canvas.getBoundingClientRect(); 
                const cw = window.System.canvas.width; 
                const ch = window.System.canvas.height;
                const scaleX = cw / rect.width;
                const scaleY = ch / rect.height;
                const clickX = (e.clientX - rect.left) * scaleX;
                const clickY = (e.clientY - rect.top) * scaleY;
                const yPct = (e.clientY - rect.top) / rect.height;

                KartAudio.init(); if(KartAudio.ctx && KartAudio.ctx.state === 'suspended') KartAudio.ctx.resume();

                if(this.isOnline&&(this.raceState==='FINISHED'||this.raceState==='CUP_END')){const b=this.onlineActionHitbox;if(b&&clickX>=b.x&&clickX<=b.x+b.w&&clickY>=b.y&&clickY<=b.y+b.h){this.confirmOnlineStage();window.Sfx.click();}return;}
                // --- SISTEMA DE PÓDIO E COPA (NOVO) ---
                if (this.raceState === "FINISHED") {
                    if(!this.isOnline||this.podiumAcceptedMatch!==this.lastStartedMatch){
                    if (window.Profile) { window.Profile.coins = (Number(window.Profile.coins) || 0) + this.reward; if(window.Profile.save) window.Profile.save(); }
                    this.player.lap = 1;
                    this.player.finished = false;
                    this.reward = 0;
                    
                    // Adiciona Pontos
                    let pts = [15, 12, 10, 8, 6, 4, 2, 1];
                    this.cupPoints = (this.cupPoints || 0) + (pts[this.finalRank - 1] || 1);
                    if (this.isOnline && this.dbRef) {
                        this.dbRef.child('players/' + this.networkId).update({ cupPoints: this.cupPoints });
                    }
                    
                    this.podiumAcceptedMatch=this.lastStartedMatch;
                    }
                    let nextTrackId = this.selectedTrack + 1;
                    if (nextTrackId < TRACKS.length) {
                        // Próxima Corrida
                        if (this.isOnline) {
                            if (this.isHost) {
                                this.beginOnlineRace(nextTrackId);
                            } else {
                                this.pushMsg("AGUARDANDO HOST...", "#fff", 30);
                            }
                        } else {
                            this.selectedTrack = nextTrackId;
                            this.startRace(this.selectedTrack);
                        }
                    } else {
                        // Fim da Copa -> Pódio
                        if (this.isOnline) {
                            if (this.isHost) this.roomRef.update({ raceState: 'CUP_END' });
                        } else {
                            this.raceState = 'CUP_END';
                        }
                    }
                    
                    window.Sfx.click();
                    return;
                }

                if (this.raceState === "CUP_END") {
                    this.cupPoints = 0;
                    this.player.lap = 1;
                    this.player.finished = false;
                    this.raceState = "RUNNING";
                    this.reward = 0;
                    this.state = 'LOBBY';
                    if (this.isOnline && this.isHost) {
                        this.roomRef.update({ raceState: 'LOBBY', trackId: 0, 'shared/hazards': null });
                    }
                    this.resetPhysics();
                    window.Sfx.click();
                    return;
                }
                // ------------------------------------

                if (this.state === 'MODE_SELECT') { 
                    this.selectMode(yPct<.55?'OFFLINE':'ONLINE');
                    window.Sfx.click(); 
                } 
                else if (this.state === 'LOBBY'||this.state==='WAITING') {
                    if (yPct > 0.8) { 
                        if (this.isOnline) {
                            if (this.isHost) {
                                const activePlayers = this.liveHumans();
                                if (activePlayers.length >= 2) { 
                                    this.beginOnlineRace(this.selectedTrack);
                                } else { 
                                    window.System.msg("PRECISA DE 2 JOGADORES!"); window.Sfx.play(150, 'sawtooth', 0.3, 0.1); 
                                }
                            } else { this.toggleReady(); }
                        } else { this.startRace(this.currentFase.trackId !== undefined ? this.currentFase.trackId : this.selectedTrack); }
                    } else {
                        if (this.lobbyHitboxes) {
                            let clicked = this.lobbyHitboxes.find(b => clickX >= b.x && clickX <= b.x + b.w && clickY >= b.y && clickY <= b.y + b.h);
                            if (clicked) {
                                if (clicked.action === 'change_char') {
                                    this.selectedChar = (this.selectedChar + 1) % CHARACTERS.length; window.Sfx.hover(); if(this.isOnline) this.syncLobby(); 
                                } else if (clicked.action === 'change_track') {
                                    if (this.currentFase.id === 'arcade') {
                                        if(!this.isOnline || this.isHost) { 
                                            this.selectedTrack = (this.selectedTrack + 1) % TRACKS.length; window.Sfx.hover(); if(this.isOnline && this.isHost) this.roomRef.update({ trackId: this.selectedTrack }); 
                                        }
                                    } else { window.Sfx.error(); this.pushMsg("PISTA FIXA NA MISSÃO!", "#f00", 25); }
                                } else if (clicked.action === 'toggle_kart') {
                                    this.useCustomKart=!this.useCustomKart;this.saveGarage();window.Sfx.hover();
                                } else if (clicked.action === 'open_shop') {
                                    this.state = 'KART_SHOP'; this.shopTab = 'SHOP'; this.shopCarouselIdx = 1; window.Sfx.click();
                                }
                            }
                        }
                    }
                }
                else if (this.state === 'KART_SHOP') {
                    if (this.shopHitboxes) {
                        let clicked = this.shopHitboxes.find(b => clickX >= b.x && clickX <= b.x + b.w && clickY >= b.y && clickY <= b.y + b.h);
                        if (clicked) {
                            if (clicked.action === 'back') { this.state = 'LOBBY'; window.Sfx.click(); } 
                            else if (clicked.action === 'tab_shop') { this.shopTab = 'SHOP'; this.shopCarouselIdx = 1; window.Sfx.hover(); }
                            else if (clicked.action === 'tab_garage') { this.shopTab = 'GARAGE'; this.shopCarouselIdx = 0; window.Sfx.hover(); }
                            else if (clicked.action === 'tab_parts') { this.shopTab = 'PARTS'; window.Sfx.hover(); }
                            else if (clicked.action === 'prev') { 
                                this.shopCarouselIdx--; 
                                let max = this.shopTab === 'SHOP' ? KART_MODELS.length - 1 : this.garage.length - 1;
                                if(this.shopCarouselIdx < 0) this.shopCarouselIdx = max; 
                                window.Sfx.hover(); 
                            }
                            else if (clicked.action === 'next') { 
                                this.shopCarouselIdx++; 
                                let max = this.shopTab === 'SHOP' ? KART_MODELS.length - 1 : this.garage.length - 1;
                                if(this.shopCarouselIdx > max) this.shopCarouselIdx = 0; 
                                window.Sfx.hover(); 
                            }
                            else if (clicked.action === 'equip') { this.activeKartIdx=this.shopCarouselIdx;this.useCustomKart=true;this.saveGarage(); window.Sfx.click(); }
                            else if (clicked.action === 'sell') {
                                if (this.garage.length > 1) {
                                    const model = KART_MODELS[this.garage[this.shopCarouselIdx].modelId];
                                    let refund = Math.floor(model.price * 0.5);
                                    if (window.Profile) window.Profile.coins = (Number(window.Profile.coins) || 0) + refund;
                                    this.garage.splice(this.shopCarouselIdx, 1);
                                    this.shopCarouselIdx = 0; this.activeKartIdx = 0;
                                    this.saveGarage(); window.Sfx.coin(); window.System.msg(`VENDIDO POR R$${refund}`);
                                } else { window.Sfx.error(); window.System.msg("NÃO PODE VENDER SEU ÚLTIMO KART!"); }
                            }
                            else if (clicked.action === 'buy_kart') {
                                let model = KART_MODELS[clicked.modelId]; let wallet = window.Profile ? (window.Profile.coins || 0) : 0;
                                if (this.garage.length >= 3) { window.Sfx.error(); window.System.msg("GARAGEM CHEIA! (MÁX 3)"); } 
                                else if (wallet >= model.price) {
                                    if (window.Profile) window.Profile.coins -= model.price;
                                    this.garage.push({ modelId: model.id }); this.saveGarage(); window.Sfx.coin(); window.System.msg("KART COMPRADO!");
                                } else { window.Sfx.error(); window.System.msg("SEM SALDO SUFICIENTE!"); }
                            }
                            else if (clicked.action === 'buy_upgrade') {
                                let type = clicked.type; let cost = clicked.cost; let targetLvl = clicked.targetLvl;
                                let wallet = window.Profile ? (window.Profile.coins || 0) : 0;
                                if (wallet >= cost) {
                                    if (window.Profile) { window.Profile.coins -= cost; }
                                    this.kartUpgrades[type] = targetLvl; this.saveGarage(); window.Sfx.coin(); window.System.msg("UPGRADE ADQUIRIDO!");
                                } else { window.Sfx.error(); window.System.msg("SEM SALDO SUFICIENTE!"); }
                            }
                        }
                    }
                } 
            };
        },

        saveGarage: function() {
            if (window.Profile) {
                if (!window.Profile.kartSave) window.Profile.kartSave = {};
                window.Profile.kartSave.garage = this.garage;
                window.Profile.kartSave.activeKartIdx = this.activeKartIdx;
                window.Profile.kartSave.upgrades=this.kartUpgrades;window.Profile.kartSave.useCustomKart=this.useCustomKart;
                if (window.Profile.save) window.Profile.save();
            }
        },

        buildTrack: function(trackId) {
            let seed=(Number(this.matchSeed)||trackId+1)>>>0;const random=()=>{if(!this.isOnline)return Math.random();seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
            segments = []; const trk = TRACKS[trackId]; this.skyColor = trk.sky; const mult = trk.curveMult;
            const addRoad = (len, curve) => { 
                for(let i=0; i<len; i++) {
                    let obsList = [];
                    let globalIdx = segments.length; 
                    
                    let coinChance = (this.currentFase.mode === 'COIN_HUNT') ? 0.8 : 0.3;
                    if (globalIdx % 8 === 0 && random() < coinChance) { obsList.push({ id: 'c_'+globalIdx, type: 'coin', x: (random() - 0.5) * 1.6, collected: false }); }
                    
                    if (globalIdx > 50 && globalIdx % 35 === 0) {
                        obsList.push({ id: 'bx_'+globalIdx, type: 'item_box', x: (random() - 0.5) * 1.4, collected: false });
                        if(random() < 0.4) { obsList.push({ id: 'bx2_'+globalIdx, type: 'item_box', x: (random() - 0.5) * 1.4, collected: false }); }
                    }
                    
                    segments.push({ curve: curve * mult, color: Math.floor(segments.length / CONF.RUMBLE_LENGTH) % 2 ? 'dark' : 'light', theme: trk.theme, obs: obsList }); 
                }
            };
            if (trackId === 0) { addRoad(50, 0); addRoad(40, 2); addRoad(40, 0); addRoad(60, -3); addRoad(40, 0); addRoad(60, 4); addRoad(50, -2); addRoad(80, 0); } 
            else if (trackId === 1) { addRoad(80, 0); addRoad(60, -1); addRoad(40, -4); addRoad(100, 0); addRoad(60, 2); addRoad(40, 0); addRoad(30, 5); addRoad(100, 0); } 
            else { addRoad(40, 0); addRoad(30, 3); addRoad(30, -3); addRoad(30, 3); addRoad(20, -5); addRoad(100, 0); addRoad(50, 2); addRoad(50, 0); }
            trackLength = segments.length * CONF.SEGMENT_LENGTH; buildMiniMap(segments);
        },

        selectMode(mode) {
            if(mode==='ONLINE'&&!window.DB){window.System.msg('ENTRE NA CONTA PARA JOGAR ONLINE');return;}
            this.resetPhysics();this.isOnline=mode==='ONLINE';this.state='LOBBY';
            this.selectedTrack=Number(this.currentFase.trackId)||0;
            if(this.isOnline)this.connectMultiplayer();else this.rivals=[];
        },
        cupTracks(first=this.selectedTrack){return TRACKS.map((_,i)=>i).filter(i=>i>=first);},
        onlineStorageKey(kind){return 'thia:kart:cup-v2:'+kind+':'+window.System?.playerId+':'+this.currentFase.id;},
        readOnlineStorage(kind,fallback){try{return JSON.parse(sessionStorage.getItem(this.onlineStorageKey(kind))||'null')??fallback;}catch{return fallback;}},
        writeOnlineStorage(kind,value){try{sessionStorage.setItem(this.onlineStorageKey(kind),JSON.stringify(value));}catch{}},
        difficultyName(shared=true){
            if(shared&&this.isOnline&&this.onlineCup?.difficulty)return this.onlineCup.difficulty;
            return this.currentFase.id==='arcade'?({easy:'EASY',normal:'MEDIUM',hard:'HARD'}[playOptions().difficulty]||CURRENT_DIFFICULTY):(this.currentFase.diff||CURRENT_DIFFICULTY);
        },
        makeOnlineEntrants(ids){
            const diff=AI_DIFFICULTY_SETTINGS[this.difficultyName(false)],entrants={};
            for(const id of ids){const p=this.remotePlayersData[id];entrants[id]={id,name:p.name||'Jogador',charId:Number(p.charId)||0,isBot:false};}
            const available=CHARACTERS.map((_,i)=>i).filter(i=>!ids.some(id=>Number(entrants[id].charId)===i));
            for(let i=0;i<4;i++){
                const charId=available.length?available.splice(Math.floor(Math.random()*available.length),1)[0]:i%CHARACTERS.length,id='bot_'+i;
                entrants[id]={id,name:CHARACTERS[charId].name,charId,isBot:true,x:(i%2===0?-.5:.5)*(1+i*.2),
                    ai_speedMult:diff.speedMult+Math.random()*.1,ai_accelMult:diff.accelMult,ai_reaction:diff.reaction,ai_lookAhead:diff.lookAhead};
            }
            return entrants;
        },
        beginOnlineRace(trackId=this.selectedTrack){
            const ids=this.liveHumans();if(!this.isHost||!this.roomRef||ids.length<2){window.System.msg('PRECISA DE 2 JOGADORES CONECTADOS');return false;}
            if(this.onlineCup&&['RACING','RESULTS'].includes(this.onlineCup.state)){window.System.msg('A COPA JÁ COMEÇOU • CONFIRMEM A ETAPA PARA CONTINUAR');return false;}
            const first=this.currentFase.id==='arcade'?Number(trackId):Number(this.currentFase.trackId)||0;
            const id=this.networkId+'_'+(globalThis.crypto?.randomUUID?.()||this.networkNow()+'_'+Math.random());
            const cup={id,phaseId:this.currentFase.id,difficulty:this.difficultyName(false),tracks:this.cupTracks(first),stage:0,humans:ids,entrants:this.makeOnlineEntrants(ids),scores:{},results:{},state:'RACING',
                matchId:id+'_0',trackId:first,seed:Math.floor(Math.random()*4294967295),startedAt:this.networkNow(),pausedAt:0};
            this.networkWrite(()=>this.roomRef.child('cup').transaction(old=>old&&['RACING','RESULTS'].includes(old.state)?undefined:cup));return true;
        },
        buildOnlineBots(recover=false){
            const cup=this.onlineCup;if(!cup)return;
            this.localBots=this.isHost?Object.entries(cup.entrants).filter(([,p])=>p.isBot).map(([id,p])=>{
                const old=recover&&this.remotePlayersData[id]?.matchId===cup.matchId?this.remotePlayersData[id]:{};
                return {...p,pos:0,speed:0,lap:1,status:'RACING',finishTime:0,ai_targetLane:p.x,ai_laneTimer:0,item:null,useItemTimer:0,kartId:0,...old,id,color:CHARACTERS[p.charId].color};
            }):[];
        },
        checkpointOnlineRace(){
            if(!this.onlineCup||this.lastStartedMatch!==this.onlineCup.matchId)return;
            const collected=[];for(const segment of segments)for(const o of segment.obs||[])if(o.collected&&o.id&&o.type!=='banana')collected.push(o.id);
            this.writeOnlineStorage('pose',{cup:this.onlineCup.id,match:this.lastStartedMatch,pos:this.pos,x:this.playerX,lap:this.lap,maxLapPos:this.maxLapPos,
                coins:this.matchCoins,score:this.score,status:this.status,finishTime:this.finishTime,collected});
        },
        restoreOnlineRace(){
            const p=this.readOnlineStorage('pose',null);if(!p||p.cup!==this.onlineCup.id||p.match!==this.lastStartedMatch)return;
            if(!Number.isFinite(p.pos)||p.pos<0||p.pos>=trackLength||!Number.isInteger(p.lap)||p.lap<1||p.lap>CONF.TOTAL_LAPS)return;
            this.pos=p.pos;this.playerX=Math.max(-1.8,Math.min(1.8,Number(p.x)||0));this.cameraX=this.playerX;this.lap=p.lap;this.player.lap=p.lap;
            this.maxLapPos=Math.max(0,Math.min(trackLength,Number(p.maxLapPos)||0));this.matchCoins=Math.max(0,Number(p.coins)||0);this.score=Math.max(0,Number(p.score)||0);
            const collected=new Set(p.collected||[]);for(const segment of segments)for(const o of segment.obs||[])if(collected.has(o.id))o.collected=true;
            if(p.status==='FINISHED'&&Number(p.finishTime)>0){this.status='FINISHED';this.finishTime=p.finishTime;this.player.finished=true;this.player.lap=CONF.TOTAL_LAPS+1;this.raceState='FINISHED';}
        },
        applyOnlineCup(cup){
            this.onlineCup=cup;this.serverRaceState=cup?.state||'LOBBY';
            if(!cup||cup.state==='LOBBY'){
                const roster=this.remotePlayersData;this.resetPhysics();this.remotePlayersData=roster;this.state='LOBBY';this.selectedTrack=this.currentFase.id==='arcade'&&Number.isInteger(this.previewTrack)?this.previewTrack:Number(this.currentFase.trackId)||0;this.cupPoints=0;this.lastStartedMatch='';this.networkPaused=false;this.onlineResultConfirmed=false;return;
            }
            if(cup.phaseId!==this.currentFase.id)return;
            this.cupPoints=Number(cup.scores?.[this.networkId])||0;this.onlineParticipants=cup.humans;
            if(!cup.humans.includes(this.networkId)){this.state='LOBBY';this.waitingForNextCup=true;return;}
            this.waitingForNextCup=false;this.selectedTrack=cup.trackId;this.networkPaused=!!cup.pausedAt||cup.humans.some(id=>!this.liveHumans().includes(id));
            if(cup.state==='RACING'&&this.lastStartedMatch!==cup.matchId){
                this.lastStartedMatch=cup.matchId;this.matchSeed=cup.seed;this.onlineRaceStart=cup.startedAt;this.onlineResultConfirmed=false;this.confirmedOnlineMatch='';this.isReady=false;
                this.startRace(cup.trackId);this.restoreOnlineRace();this.applyOnlineShells();this.applyOnlineImpacts();this.syncMultiplayer(true);
            }else if(cup.state==='RESULTS'||cup.state==='CUP_END'){
                if(cup.state==='CUP_END'&&this.dismissedOnlineCup===cup.id){this.state='LOBBY';this.raceState='RUNNING';return;}
                this.state='RACE';this.raceState=cup.state==='CUP_END'?'CUP_END':'FINISHED';
                const result=cup.results?.[cup.matchId],mine=result?.ranking.find(r=>r.id===this.networkId);
                if(mine){this.finalRank=mine.rank;this.status=mine.status;this.onlineResultConfirmed=true;this.applyOnlineStageReward(cup.matchId,mine);}
                const all=Object.values(cup.results||{}),finished=all.every(r=>r.ranking.find(p=>p.id===this.networkId)?.status==='FINISHED');
                const place=cup.standings?.findIndex(p=>p.id===this.networkId)+1;
                this.onlineCupOutcome={id:cup.id,complete:cup.state==='CUP_END',score:all.reduce((n,r)=>n+Number(r.ranking.find(p=>p.id===this.networkId)?.score||0),0),
                    won:finished&&(this.currentFase.mode==='COIN_HUNT'?all.reduce((n,r)=>n+Number(r.ranking.find(p=>p.id===this.networkId)?.coins||0),0)>=this.currentFase.targetCoins:place>0&&place<=this.currentFase.targetRank)};
                if(this.onlineCupOutcome.complete)this.applyOnlineCupCareer();
            }
            this.refreshOnlineRivals();this.evaluateOnlineCup();
        },
        applyOnlineStageReward(matchId,result){
            const receipts=this.readOnlineStorage('awards',{}),key=this.onlineStorageKey('awards')+':'+matchId;this.onlineAwardMemory=this.onlineAwardMemory||new Set();if(receipts[matchId]||this.onlineAwardMemory.has(key))return;
            const reward=result.status==='FINISHED'?1000+(Number(this.currentFase.reqLvl)||1)*250:0;
            const balance=Number(window.Profile?.coins);
            if(!Number.isSafeInteger(balance)||balance<0||balance>Number.MAX_SAFE_INTEGER-reward)return;
            this.onlineAwardMemory.add(key);receipts[matchId]=true;this.writeOnlineStorage('awards',Object.fromEntries(Object.entries(receipts).slice(-100)));
            if(window.Profile&&reward){window.Profile.coins=balance+reward;window.Profile.save?.();}
        },
        applyOnlineCupCareer(){
            const outcome=this.onlineCupOutcome;if(!outcome?.complete||typeof window.Profile?.addReward!=='function')return;
            const receipts=this.readOnlineStorage('career',{}),key=this.onlineStorageKey('career')+':'+outcome.id;this.onlineAwardMemory=this.onlineAwardMemory||new Set();
            if(receipts[outcome.id]||this.onlineAwardMemory.has(key))return;
            this.onlineAwardMemory.add(key);receipts[outcome.id]=true;this.writeOnlineStorage('career',Object.fromEntries(Object.entries(receipts).slice(-100)));
            this.onlineCareerReward=window.Profile.addReward(outcome.score,outcome.won,0);
        },
        confirmOnlineStage(){
            const cup=this.onlineCup;if(!this.roomRef||!cup||!cup.humans.includes(this.networkId))return false;
            if(cup.state!=='RESULTS'&&cup.state!=='CUP_END'){window.System.msg('AGUARDE OS OUTROS JOGADORES TERMINAREM');return false;}
            const token=cup.matchId+':'+cup.state;this.confirmedOnlineMatch=token;if(cup.state==='CUP_END'){this.dismissedOnlineCup=cup.id;this.state='LOBBY';this.raceState='RUNNING';this.selectedTrack=Number(this.currentFase.trackId)||0;this.isReady=false;}this.networkWrite(()=>this.roomRef.child('players/'+this.networkId).update({confirmedMatch:token,lastSeen:firebase.database.ServerValue.TIMESTAMP}));return true;
        },
        evaluateOnlineCup(){
            const cup=this.onlineCup;if(!this.isHost||!this.roomRef||!cup||!cup.humans.includes(this.networkId)||this.cupActionPending)return;
            const live=this.liveHumans(),missing=cup.humans.some(id=>!live.includes(id));let next=null;
            if(cup.state==='RACING'){
                if(missing&&!cup.pausedAt)next={...cup,pausedAt:this.networkNow()};
                else if(!missing&&cup.pausedAt)next={...cup,startedAt:cup.startedAt+Math.max(0,this.networkNow()-cup.pausedAt),pausedAt:0};
                else if(!missing&&!cup.pausedAt){
                    const complete=cup.humans.every(id=>this.remotePlayersData[id]?.matchId===cup.matchId&&this.remotePlayersData[id]?.status==='FINISHED');
                    if(complete||this.networkNow()-cup.startedAt>=SAFETY.MAX_RACE_TIME)next=this.finishOnlineStage(cup);
                }
            }else if((cup.state==='RESULTS'||cup.state==='CUP_END')&&!missing&&cup.humans.every(id=>this.remotePlayersData[id]?.confirmedMatch===cup.matchId+':'+cup.state)){
                if(cup.state==='CUP_END')next={...cup,state:'LOBBY'};
                else if(cup.stage+1>=cup.tracks.length)next={...cup,state:'CUP_END'};
                else{const stage=cup.stage+1;next={...cup,stage,matchId:cup.id+'_'+stage,trackId:cup.tracks[stage],seed:Math.floor(Math.random()*4294967295),state:'RACING',startedAt:this.networkNow(),pausedAt:0};}
            }
            if(!next)return;
            const ref=this.roomRef,expected=JSON.stringify(cup);this.cupActionPending=true;
            this.networkWrite(()=>ref.child('cup').transaction(old=>JSON.stringify(old)===expected?next:undefined)).then(result=>{this.cupActionPending=false;if(result?.committed&&this.roomRef===ref)this.evaluateOnlineCup();});
        },
        finishOnlineStage(cup){
            const ranking=Object.entries(cup.entrants).map(([id,e])=>{
                const p=this.remotePlayersData[id]||{},valid=p.matchId===cup.matchId,finished=valid&&p.status==='FINISHED'&&Number(p.finishTime)>0;
                return {id,name:e.name,isBot:e.isBot,status:finished?'FINISHED':'DNF',finishTime:finished?Number(p.finishTime):0,
                    distance:valid?Math.max(0,Number(p.lap)||0)*trackLength+Math.max(0,Number(p.pos)||0):0,coins:valid?Number(p.coins)||0:0,score:valid?Number(p.score)||0:0};
            });
            ranking.sort((a,b)=>(b.status==='FINISHED')-(a.status==='FINISHED')||(a.status==='FINISHED'?a.finishTime-b.finishTime:b.distance-a.distance)||a.id.localeCompare(b.id));
            const scores={...cup.scores},points=[15,12,10,8,6,4,2,1];ranking.forEach((r,i)=>{r.rank=i+1;r.points=r.status==='FINISHED'?(points[i]||1):0;scores[r.id]=(Number(scores[r.id])||0)+r.points;});
            const results={...cup.results,[cup.matchId]:{stage:cup.stage,trackId:cup.trackId,ranking}};
            const standings=Object.entries(cup.entrants).map(([id,e])=>({id,name:e.name,isBot:e.isBot,points:scores[id]||0,wins:Object.values(results).filter(r=>r.ranking[0]?.id===id&&r.ranking[0]?.status==='FINISHED').length}));
            standings.sort((a,b)=>b.points-a.points||b.wins-a.wins||a.id.localeCompare(b.id));
            return {...cup,state:'RESULTS',scores,results,standings};
        },
        refreshOnlineRivals(){
            const ids=this.onlineCup&&this.onlineCup.state!=='LOBBY'?this.onlineCup.humans:this.liveHumans(),data=this.remotePlayersData||{};
            const human=ids.filter(id=>id!==this.networkId&&data[id]).map(id=>({id,...data[id],isRemote:true,color:CHARACTERS[data[id].charId||0]?.color||'#fff'}));
            const bots=this.isHost?this.localBots:Object.entries(data).filter(([id,p])=>id.startsWith('bot_')&&p.matchId===this.lastStartedMatch).map(([id,p])=>({id,...p,isRemote:true,color:CHARACTERS[p.charId||0]?.color||'#fff'}));
            this.rivals=[...human,...bots];
        },
        performHostMaintenance(){
            if(!this.isOnline||!this.roomRef)return;
            this.syncMultiplayer(true);this.evaluateOnlineCup();
            if(this.isHost&&this.clockReady)for(const[id,p]of Object.entries(this.remotePlayersData||{}))if(!id.startsWith('bot_')&&id!==this.networkId&&this.networkNow()-Number(p.lastSeen||0)>SAFETY.ZOMBIE_TIMEOUT)this.networkWrite(()=>this.roomRef.child('players/'+id).remove());
        },
        reconcileOnlineRoster(){
            if(!this.roomRef||!this.rosterKnown||!this.hostKnown)return;
            const ref=this.roomRef,ids=this.liveHumans(),wasHost=this.isHost;
            this.isHost=ids.includes(this.roomHostId)&&this.roomHostId===this.networkId;
            if(!ids.includes(this.roomHostId)&&ids[0]===this.networkId&&!this.claimingHost){this.claimingHost=true;this.networkWrite(()=>ref.child('host').transaction(old=>ids.includes(old)?old:this.networkId)).finally(()=>{this.claimingHost=false;});}
            if(this.isHost&&!wasHost&&this.onlineCup?.state==='RACING')this.buildOnlineBots(true);
            if(!this.isHost&&wasHost)this.localBots=[];
            this.networkPaused=this.onlineCup?.state==='RACING'&&(!!this.onlineCup.pausedAt||this.onlineCup.humans.some(id=>!ids.includes(id)));
            this.refreshOnlineRivals();this.evaluateOnlineCup();
        },
        spawnShell(owner,targetId,pos,x,speed){
            if(!this.isOnline){this.projectiles.push({owner,targetId,pos,x,speed,active:true,life:400});return;}
            const id=globalThis.crypto?.randomUUID?.()||this.networkId+'_'+Date.now()+'_'+Math.random();
            const record={owner:owner==='player'?this.networkId:owner,target:targetId==='player'?this.networkId:targetId,matchId:this.lastStartedMatch,pos,x,speed};
            this.networkWrite(()=>this.roomRef.child('shared/shells/'+id).set(record));
        },
        applyOnlineShells(data=this.pendingShells||{}){
            if(!this.onlineCup||this.onlineCup.state!=='RACING')return;
            for(const[id,s]of Object.entries(data))if(s.matchId===this.lastStartedMatch&&!this.projectiles.some(p=>p.networkId===id))this.projectiles.push({networkId:id,owner:s.owner,targetId:s.target===this.networkId?'player':s.target,pos:s.pos,x:s.x,speed:s.speed,active:true,life:400});
            for(const p of this.projectiles)if(p.networkId&&!data[p.networkId])p.active=false;
        },
        publishShellImpact(shell,target){
            if(!this.isHost||!shell.networkId)return;
            this.networkWrite(()=>this.roomRef.update({['shared/impacts/'+shell.networkId]:{matchId:this.lastStartedMatch,target:target==='player'?this.networkId:target},['shared/shells/'+shell.networkId]:null}));
        },
        applyOnlineImpacts(){
            if(!this.onlineCup||this.onlineCup.state!=='RACING')return;
            this.seenOnlineImpacts=this.seenOnlineImpacts||new Set();
            for(const[id,hit]of Object.entries(this.pendingImpacts||{})){
                if(hit.matchId!==this.lastStartedMatch||this.seenOnlineImpacts.has(id))continue;this.seenOnlineImpacts.add(id);
                if(hit.target===this.networkId&&this.status==='RACING'){
                    const kart=this.useCustomKart?KART_MODELS[this.garage[this.activeKartIdx]?.modelId||0]:KART_MODELS[0];
                    if(kart.type==='tank'||kart.type==='plane')continue;
                    this.speed*=.2;this.spinTimer=40;const weight=CHARACTERS[this.selectedChar].weight+(this.useCustomKart?kart.weightBonus:0);let bounce=weight>1.4?-40:-80;
                    if(this.useCustomKart&&this.kartUpgrades.suspension>1)bounce*=1-(this.kartUpgrades.suspension-1)*.25;
                    this.bounce=bounce;window.Sfx.error();window.Gfx.shakeScreen(30);this.pushMsg('ATINGIDO!','#f00',40);
                }else if(this.isHost){const bot=this.localBots.find(b=>b.id===hit.target&&b.status==='RACING');if(bot){bot.speed*=.2;bot.spinTimer=40;}}
            }
        },
        dropOnlineBotBanana(bot){
            const id='b_'+bot.id+'_'+this.networkNow()+'_'+Math.random().toString(36).slice(2),pos=(bot.pos-CONF.SEGMENT_LENGTH*2+trackLength)%trackLength;
            this.networkWrite(()=>this.roomRef.child('shared/hazards/'+id).set({pos,x:bot.x,owner:bot.id,time:this.networkNow(),matchId:this.lastStartedMatch}));
        },
        applyOnlineHazards(){
            if(!segments.length)return;const data=Object.fromEntries(Object.entries(this.pendingHazards||{}).filter(([,hz])=>hz.matchId===this.lastStartedMatch));
            for(const seg of segments)if(seg.obs)seg.obs=seg.obs.filter(o=>o.type!=='banana'||!o.owner||data[o.id]);
            for(const[id,hz]of Object.entries(data)){const seg=getSegment(Number(hz.pos)/CONF.SEGMENT_LENGTH);if(!seg)continue;seg.obs=seg.obs||[];if(!seg.obs.some(o=>o.id===id))seg.obs.push({id,type:'banana',x:hz.x,collected:false,owner:hz.owner,time:hz.time});}
        },
        connectMultiplayer(){
            if(!window.DB){this.state='MODE_SELECT';window.System.msg('ENTRE NA CONTA PARA JOGAR ONLINE');return;}
            const suffix=this.readOnlineStorage('peer',null)||globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2);this.writeOnlineStorage('peer',suffix);
            this.peerId=String(window.System.playerId||'player')+'_'+suffix;
            this.networkPath='rooms/'+this.roomId+'_cups_v2_'+this.currentFase.id;
            const ref=this.roomRef=window.DB.ref(this.networkPath);this.dbRef=ref;this.hostKnown=this.rosterKnown=false;this.roomHostId='';this.lastSync=0;
            const fail=error=>{if(this.roomRef!==ref)return;window.System.msg('SALA INDISPONÍVEL • CONFIRA A CONTA E A CONEXÃO');console.warn('Kart room:',error?.code||'connection');};
            const watch=(path,callback)=>ref.child(path).on('value',snap=>{if(this.roomRef===ref)callback(snap);},fail);
            this.clockRef=window.DB.ref('.info/serverTimeOffset');this.clockRef.on('value',snap=>{this.serverClockOffset=Number(snap.val())||0;this.clockReady=Number.isFinite(snap.val());this.reconcileOnlineRoster();},()=>{});
            watch('host',snap=>{this.roomHostId=snap.val()||'';this.hostKnown=true;this.reconcileOnlineRoster();});
            watch('players',snap=>{this.remotePlayersData=snap.val()||{};this.rosterKnown=true;this.reconcileOnlineRoster();});
            watch('cup',snap=>this.applyOnlineCup(snap.val()));
            watch('trackId',snap=>{const track=snap.val();if(this.currentFase.id==='arcade'&&Number.isInteger(track)&&track>=0&&track<TRACKS.length){this.previewTrack=track;if(!this.onlineCup||this.onlineCup.state==='LOBBY'||this.onlineCup.state==='CUP_END')this.selectedTrack=track;}});
            watch('shared/hazards',snap=>{this.pendingHazards=snap.val()||{};this.applyOnlineHazards();});
            watch('shared/shells',snap=>{this.pendingShells=snap.val()||{};this.applyOnlineShells();});
            watch('shared/impacts',snap=>{this.pendingImpacts=snap.val()||{};this.applyOnlineImpacts();});
            const own=ref.child('players/'+this.networkId);this.networkWrite(async()=>{await own.onDisconnect().remove();if(this.roomRef!==ref)return;await own.update({name:window.Profile?.username||'Jogador',charId:this.selectedChar,ready:false,lastSeen:firebase.database.ServerValue.TIMESTAMP});});
            this.maintenanceInterval=setInterval(()=>this.performHostMaintenance(),1000);
        },

        toggleReady: function() { this.isReady = !this.isReady; window.Sfx.click(); if(!this.isOnline) { let trk = this.currentFase.id === 'arcade' ? this.selectedTrack : this.currentFase.trackId; this.startRace(trk); return; } this.state = this.isReady ? 'WAITING' : 'LOBBY'; this.syncLobby(); },
        syncLobby: function() { if(this.dbRef)this.networkWrite(()=>this.dbRef.child('players/'+this.networkId).update({charId:this.selectedChar,ready:this.isReady,lastSeen:firebase.database.ServerValue.TIMESTAMP})); },

        startRace: function(trackId) {
            const roster=this.remotePlayersData;this.resetPhysics();if(this.isOnline)this.remotePlayersData=roster;
            this.selectedTrack=trackId;this.lastTime=performance.now();this.physicsAccumulator=0;this.driftBoosts=0;
            // Every new race must clear the previous finish state. Otherwise the
            // render loop sees RACE but exits early from updatePhysics, leaving
            // touch steering and rival simulation apparently frozen.
            this.raceState = "RUNNING";
            this.player.lap = 1;
            this.player.finished = false;
            this.totalLaps = CONF.TOTAL_LAPS;
            this.reward = 0;
            this.state = 'RACE'; this.status = 'RACING'; this.buildTrack(trackId);this.applyOnlineHazards();
            nitroBtn.style.display = 'flex'; resetBtn.style.display = 'none'; 
            this.pushMsg("LARGADA!", "#0f0", 60); window.Sfx.play(600, 'square', 0.5, 0.2); KartAudio.start();
            this.pos = 0; this.lap = 1; this.maxLapPos = 0; this.speed = 0; this.finishTime = 0; this.localBots = []; this.collisionContacts = new Set();
            
            const diff=AI_DIFFICULTY_SETTINGS[this.difficultyName()];
            if(this.isOnline){this.totalRacers=Object.keys(this.onlineCup?.entrants||{}).length;this.buildOnlineBots();this.refreshOnlineRivals();return;}
            if (!this.isOnline) {
                let availableChars = [0, 1, 2, 3, 4, 5, 6, 7].filter(c => c !== this.selectedChar);
                const botConfigs = [];
                for(let i=0; i<4; i++) {
                    let rIdx = Math.floor(Math.random() * availableChars.length);
                    let cId = availableChars.splice(rIdx, 1)[0];
                    botConfigs.push({ char: cId, name: CHARACTERS[cId].name });
                }

                botConfigs.forEach((cfg, i) => {
                    this.localBots.push({
                        id: 'cpu' + i, charId: cfg.char, pos: 0, x: (i % 2 === 0 ? -0.5 : 0.5) * (1 + i*0.2), speed: 0, lap: 1, status: 'RACING', finishTime: 0, name: cfg.name, color: CHARACTERS[cfg.char].color,
                        ai_speedMult: diff.speedMult + (Math.random() * 0.1), ai_accelMult: diff.accelMult, ai_reaction: diff.reaction, ai_lookAhead: diff.lookAhead, ai_targetLane: (i % 2 === 0 ? -0.5 : 0.5), ai_laneTimer: 0,
                        item: null, useItemTimer: 0, kartId: 0 
                    });
                });
                if(!this.isOnline) { this.rivals = this.localBots; } 
                else if (this.isHost) { this.localBots.forEach((b, i) => { this.dbRef.child('players/bot_' + i).set({ pos: 0, x: b.x, speed: 0, lap: 1, status: 'RACING', finishTime: 0, charId: b.charId, name: b.name, kartId: 0, lastSeen: firebase.database.ServerValue.TIMESTAMP }); }); }
            }
        },

        update: function(ctx, w, h, pose) {
            if(this.isOnline){this.syncMultiplayer();this.evaluateOnlineCup();if(this.networkPaused&&this.onlineCup?.state==='RACING'){this.lastTime=performance.now();this.renderWorld(ctx,w,h);this.renderRaceHUD(ctx,w,h);this.renderOnlineWait(ctx,w,h,'JOGADOR DESCONECTADO','A copa aguarda o retorno do participante.');return Math.floor(this.score);}}
            if (this.state === 'MODE_SELECT') { this.renderModeSelect(ctx, w, h); return; }
            if (this.state === 'LOBBY' || this.state === 'WAITING') { this.renderLobby(ctx, w, h); return; }
            if (this.state === 'KART_SHOP') { this.renderShop(ctx, w, h); return; }
            if (this.state === 'GAMEOVER') { return Math.floor(this.score); }
            
            if (this.raceState === "FINISHED") {
                if(this.isOnline){if(this.onlineCup?.state==='RACING'){const now=performance.now(),steps=Math.min(6,Math.max(0,Math.floor((now-this.lastTime)/(1000/60))));this.lastTime=now;for(let i=0;i<steps;i++){this.updateBotDrivers();this.updateProjectiles(w,h);}this.syncMultiplayer();}this.renderOnlineStage(ctx,w,h);return Math.floor(this.score);}
                this.renderWorld(ctx, w, h);
                this.renderUI(ctx, w, h);
                return Math.floor(this.score);
            }
            if (this.raceState === "CUP_END") {
                this.renderCupEnd(ctx, w, h);
                return Math.floor(this.score);
            }
            
            const now=performance.now(),elapsed=Math.max(0,Math.min(100,now-(this.lastTime??now-16.667)));
            this.lastTime=now;this.physicsAccumulator=Math.min(100,(this.physicsAccumulator||0)+elapsed);
            while(this.physicsAccumulator>=1000/60-.001){
                this.updatePhysics(w,h,pose);this.physicsAccumulator-=1000/60;
            }
            this.checkRaceStatus();
            this.renderWorld(ctx, w, h);
            this.renderUI(ctx, w, h);
            
            if (this.isOnline) this.syncMultiplayer();
            return Math.floor(this.score);
        },

        syncMultiplayer(force=false){
            if(!this.isOnline||!this.roomRef||(!force&&Date.now()-this.lastSync<=100))return;
            this.lastSync=Date.now();const racing=this.onlineCup?.humans?.includes(this.networkId)&&this.lastStartedMatch===this.onlineCup.matchId;
            const own={charId:this.selectedChar,ready:!!this.isReady,lastSeen:firebase.database.ServerValue.TIMESTAMP};
            if(racing)Object.assign(own,{matchId:this.lastStartedMatch,pos:Math.floor(this.pos),x:this.playerX,speed:this.speed,steer:this.steer,lap:this.lap,status:this.status,finishTime:this.finishTime,coins:this.matchCoins,score:this.score,kartId:this.useCustomKart?this.garage[this.activeKartIdx]?.modelId||0:0});
            const updates=Object.fromEntries(Object.entries(own).map(([key,value])=>['players/'+this.networkId+'/'+key,value]));
            if(this.isHost&&this.onlineCup?.state==='RACING')for(const b of this.localBots)updates['players/'+b.id]={name:b.name,charId:b.charId,kartId:b.kartId||0,matchId:this.lastStartedMatch,pos:Math.floor(b.pos),x:b.x,speed:b.speed,lap:b.lap,status:b.status,finishTime:b.finishTime,lastSeen:firebase.database.ServerValue.TIMESTAMP};
            this.networkWrite(()=>this.roomRef.update(updates));if(racing)this.checkpointOnlineRace();
        },

        getRankings: function() {
            let allR = [
                { id: 'player', lap: this.lap, pos: this.pos, x: this.playerX, status:this.status, finishTime:this.finishTime },
                ...this.localBots.map(b => ({ id: b.id, lap: b.lap, pos: b.pos, x: b.x, status:b.status, finishTime:b.finishTime })),
                ...this.rivals.filter(r => r.isRemote).map(r => ({ id: r.id, lap: r.lap, pos: r.pos, x: r.x, status:r.status, finishTime:r.finishTime }))
            ];
            allR.forEach(r => { r.totalDist = (r.lap * trackLength) + r.pos; });
            allR.sort((a,b)=>(b.status==='FINISHED')-(a.status==='FINISHED')||(a.status==='FINISHED'?a.finishTime-b.finishTime:b.totalDist-a.totalDist)||a.id.localeCompare(b.id));
            return allR;
        },

        checkRaceStatus: function() {
            const ranks = this.getRankings();
            this.finalRank = ranks.findIndex(r => r.id === 'player') + 1;
            
            if(this.isOnline&&this.status==='FINISHED'){this.raceState='FINISHED';this.syncMultiplayer(true);return;}
            if (this.status === 'FINISHED' && this.state !== 'GAMEOVER' && this.state !== 'SPECTATE_WAIT') {
                this.state = 'SPECTATE_WAIT'; 
                let isWin = false;
                if (this.currentFase.mode === 'RACE' && this.finalRank <= this.currentFase.targetRank) isWin = true;
                if (this.currentFase.mode === 'COIN_HUNT' && this.matchCoins >= this.currentFase.targetCoins) isWin = true;

                this.finishTimer=setTimeout(() => {
                    this.finishTimer=null;this.state = 'GAMEOVER'; KartAudio.stop();
                    if(window.System.gameOver) { window.System.gameOver(this.score, isWin, this.matchCoins); } 
                    else { window.System.home(); }
                }, 3000); 
            }
        },

        updateProjectiles(w=390,h=844,char=CHARACTERS[this.selectedChar],activeKart=KART_MODELS[this.useCustomKart?this.garage[this.activeKartIdx]?.modelId||0:0]){
            const d=this;
            d.projectiles.forEach(p => {
                if (!p.active) return;
                p.pos += p.speed; p.life--;
                if (p.pos >= trackLength) p.pos -= trackLength;
                if(p.life<=0){p.active=false;if(this.isOnline&&this.isHost&&p.networkId)this.networkWrite(()=>this.roomRef.child('shared/shells/'+p.networkId).remove());return;}

                let targetObj = null;
                if (p.targetId === 'player') {
                    targetObj = { x: d.playerX, pos: d.pos, kartType: activeKart.type, isMe: true };
                } else {
                    let bot = this.localBots.find(b => b.id === p.targetId);
                    if (bot) { targetObj = { x: bot.x, pos: bot.pos, kartType: KART_MODELS[bot.kartId || 0].type, isBot: true, ref: bot }; }
                    else {
                        let remote = this.rivals.find(rv => rv.id === p.targetId);
                        if (remote) targetObj = { x: remote.x, pos: remote.pos, kartType: KART_MODELS[remote.kartId || 0].type, isRemote: true };
                    }
                }

                if (targetObj) {
                    p.x += (targetObj.x - p.x) * 0.08;

                    let distZ = Math.abs(p.pos - targetObj.pos);
                    if (distZ > trackLength / 2) distZ = trackLength - distZ;

                    if (distZ < 250 && Math.abs(p.x - targetObj.x) < 1.0) {
                        p.active = false;

                        if(this.isOnline&&p.networkId){this.publishShellImpact(p,p.targetId);return;}
                        if (targetObj.kartType === 'tank' || targetObj.kartType === 'plane') {
                            if (targetObj.isMe) { window.Sfx.play(400, 'square', 0.1, 0.1); this.pushMsg("DEFESA BLINDADA!", "#3498db", 40); }
                        } else {
                            if (targetObj.isMe) {
                                d.speed *= 0.2; d.spinTimer = 40;
                                let baseBounce = char.weight > 1.4 ? -40 : -80;
                                if (char.suspensionLevel > 1) baseBounce *= (1 - (char.suspensionLevel - 1) * 0.25);
                                d.bounce = baseBounce;
                                window.Sfx.error(); window.Gfx.shakeScreen(30); this.pushMsg("ATINGIDO!", "#f00", 50);
                                this.spawnParticle(w/2, h*0.8, 'explosion');
                            } else if (targetObj.isBot) {
                                targetObj.ref.speed *= 0.2; targetObj.ref.spinTimer = 40; window.Sfx.play(200, 'square', 0.2, 0.2);
                                this.spawnParticle(w/2 + (targetObj.x - d.playerX)*w/2, h*0.6, 'explosion');
                            }
                        }
                    }
                }
            });

        },

        updateBotDrivers(){
            const d=this,pickupHitbox=.23;
            if (this.localBots.length > 0 && d.state !== 'GAMEOVER') {
                const diff=AI_DIFFICULTY_SETTINGS[this.difficultyName()];
                let playerTotalDist = (d.lap * trackLength) + d.pos;

                this.localBots.forEach(r => {
                    if (r.status === 'FINISHED') return;
                    const rChar = CHARACTERS[r.charId || 0];
                    let botTotalDist = (r.lap * trackLength) + r.pos;
                    let distBehind = playerTotalDist - botTotalDist;

                    let dynamicRubberBand = 1.0;
                    if (distBehind > 300 && diff.rubberBand > 0) { dynamicRubberBand = 1.0 + (Math.min(distBehind, 4000) / 4000) * diff.rubberBand; }

                    const futureSeg = getSegment((r.pos + (r.ai_lookAhead * CONF.SEGMENT_LENGTH)) / CONF.SEGMENT_LENGTH);
                    const driveRatio = rChar.accel * CONF.FRICTION / (1 - (1-rChar.accel) * CONF.FRICTION);
                    let targetSpeed = CONF.MAX_SPEED * rChar.speedInfo * r.ai_speedMult * dynamicRubberBand * driveRatio;
                    if (Math.abs(futureSeg.curve) > 2) targetSpeed *= 0.85; else if (Math.abs(futureSeg.curve) > 1) targetSpeed *= 0.95;

                    const botSeg = getSegment(r.pos / CONF.SEGMENT_LENGTH);
                    if (botSeg.obs) {
                        botSeg.obs.forEach(o => {
                            if (!o.collected && Math.abs(r.x - o.x) < pickupHitbox) {
                                if (o.type === 'coin') { if(!this.isOnline)o.collected = true; }
                                else if (o.type === 'item_box' && !r.item) {
                                    if(!this.isOnline)o.collected = true;
                                    r.item = ['mushroom', 'banana', 'shell'][Math.floor(Math.random() * 3)];
                                    r.useItemTimer = 60 + Math.floor(Math.random() * 120);
                                } else if (o.type === 'banana') { o.collected = true; r.speed *= 0.2; r.spinTimer = 40; }
                            }
                        });
                    }

                    if (r.item === 'shell') {
                        let botTarget = d.rivals.concat([{pos: d.pos, x: d.playerX}]).find(x => x.pos > r.pos && x.pos - r.pos < 1000);
                        if (botTarget) { r.ai_targetLane = botTarget.x; if (Math.abs(r.x - botTarget.x) < 0.5) r.useItemTimer = 1; }
                    }

                    if (r.item && r.useItemTimer > 0) {
                        r.useItemTimer--;
                        if (r.useItemTimer <= 0) {
                            if (r.item === 'mushroom') { r.speed = Math.min(CONF.TURBO_MAX_SPEED + 50, r.speed + 150); }
                            else if (r.item === 'banana') { if(this.isOnline)this.dropOnlineBotBanana(r);else botSeg.obs.push({ type: 'banana', x: r.x, collected: false }); }
                            else if (r.item === 'shell') {
                                let ranks = this.getRankings();
                                let myIdx = ranks.findIndex(rx => rx.id === r.id);
                                let targetIdx = myIdx - 1;
                                if (myIdx === 0) targetIdx = ranks.length - 1;
                                let targetId = ranks[targetIdx] ? ranks[targetIdx].id : null;
                                this.spawnShell(r.id,targetId,r.pos+200,r.x,Math.max(r.speed,200)+150);
                            }
                            r.item = null;
                        }
                    }

                    r.ai_laneTimer++;
                    if (r.ai_laneTimer > 80) {
                        r.ai_laneTimer = 0;
                        if (distBehind < 0 && distBehind > -500 && Math.random() < 0.8) { r.ai_targetLane = d.playerX; }
                        else if (Math.random() < 0.4) { r.ai_targetLane = [-0.7, 0, 0.7][Math.floor(Math.random() * 3)]; }
                    }
                    if (futureSeg.curve > 2) r.ai_targetLane = -0.8; else if (futureSeg.curve < -2) r.ai_targetLane = 0.8;

                    if (Math.random() < diff.errorRate * 0.15) { r.ai_targetLane = (Math.random() > 0.5 ? 1.6 : -1.6); }

                    let moveX = (r.ai_targetLane - r.x) * r.ai_reaction; moveX -= (getSegment(r.pos / CONF.SEGMENT_LENGTH).curve * 0.04);
                    r.x += moveX; if (Math.abs(r.x) > 1.8) { r.x = Math.sign(r.x)*1.8; r.speed *= 0.95; }

                    r.speed += (targetSpeed - r.speed) * rChar.accel * r.ai_accelMult;

                    if (r.spinTimer > 0) { r.spinTimer--; r.spinAngle += (Math.PI * 2) / 40; r.speed *= 0.95; } else { r.spinAngle = 0; }
                    r.pos += r.speed;

                    if (r.pos >= trackLength) { r.pos -= trackLength; r.lap++; if (r.lap > CONF.TOTAL_LAPS) { r.status = 'FINISHED'; if (r.finishTime === 0) r.finishTime = this.networkNow(); r.speed = 0; r.lap = CONF.TOTAL_LAPS; } }
                });
            }

        },

        updatePhysics: function(w, h, pose) {
            const d = Logic; 
            
            let char = { ...CHARACTERS[this.selectedChar] }; 
            let activeKart = KART_MODELS[0];
            
            if (this.useCustomKart && this.garage && this.garage[this.activeKartIdx]) {
                let kId = this.garage[this.activeKartIdx].modelId;
                activeKart = KART_MODELS.find(k => k.id === kId) || KART_MODELS[0];
                const upg = this.kartUpgrades || { engine: 1, tires: 1, suspension: 1 };
                
                char.speedInfo += activeKart.speedBonus + (upg.engine - 1) * 0.08;
                char.accel += (upg.engine - 1) * 0.005; 
                char.turnInfo += activeKart.turnBonus + (upg.tires - 1) * 0.10;
                char.weight += activeKart.weightBonus;
                
                char.tireLevel = upg.tires || 1;
                char.suspensionLevel = upg.suspension || 1;
            } else {
                char.tireLevel = 1;
                char.suspensionLevel = 1;
            }

            const canControl = (d.status === 'RACING');
            let detected = false; let itemTriggered = false;

            if (d.status === 'FINISHED') {
                let futureSeg = getSegment((d.pos + 300) / CONF.SEGMENT_LENGTH);
                d.targetSteer = 0;
                d.steer += (-futureSeg.curve * 0.05 - d.steer) * 0.1; 
                d.speed += (130-d.speed)*.05; d.playerX *= 0.95;
            } else {
                if(window.ArcadeControls?.mode!=='controls' && pose && pose.keypoints) {
                    const videoW=window.System?.video?.videoWidth||640,videoH=window.System?.video?.videoHeight||480;
                    const map=pt=>({x:(1-pt.x/videoW)*w,y:pt.y/videoH*h});
                    itemTriggered=this.readCameraItemGesture(pose,videoH)||itemTriggered;
                    const lw = pose.keypoints.find(k => k.name === 'left_wrist'); const rw = pose.keypoints.find(k => k.name === 'right_wrist'); const nose = pose.keypoints.find(k => k.name === 'nose');
                    if (lw?.score > 0.2 && rw?.score > 0.2) {
                        const pl = map(lw); const pr = map(rw);
                        const slope=pr.x>=pl.x?pr.y-pl.y:pl.y-pr.y;
                        d.targetSteer=this.cameraItemGesture?.holding?this.cameraItemGesture.steer:Math.max(-1,Math.min(1,Math.atan2(slope,Math.max(1,Math.abs(pr.x-pl.x)))*1.8))*playOptions().sensitivity;
                        d.virtualWheel = { x: (pl.x+pr.x)/2, y: (pl.y+pr.y)/2, r: Math.hypot(pr.x-pl.x, pr.y-pl.y)/2, opacity: 1 };
                        detected = true;
                        
                        if (nose && lw.y < nose.y && rw.y < nose.y) {
                            d.gestureTimer++; d.virtualWheel.isHigh = true;
                            if (d.gestureTimer > 25 && d.nitro >= 20 && !d.turboLock) { d.inputActive=true;d.trackingLost=false;d.requestTurbo(); }
                        } else { d.gestureTimer = 0; d.virtualWheel.isHigh = false; }

                        // A deliberate hand-on-head hold uses one item. Steering alone and the two-hand turbo never spend an item.
                    }
                }
                // No camera mode: use the exact touch/keyboard state, not simulated poses.
                const manual=window.ArcadeControls?.mode==="controls" ? d.arcadeManual : null;
                if(manual){
                    d.targetSteer=(Number(!!manual.right)-Number(!!manual.left))*.85*playOptions().sensitivity;
                    detected=Boolean(manual.throttle||playOptions().autoAccelerate)&&!manual.brake;
                    // Item action is processed independently of steering mode.
                    d.virtualWheel.opacity=0;
                }
                if(d.arcadeManual?.itemQueued){itemTriggered=true;d.arcadeManual.itemQueued=false;}
                d.inputActive=detected;
                d.trackingLost=!manual&&!detected;
                if(!detected && !manual){this.cameraItemGesture=null;d.targetSteer=0;d.virtualWheel.opacity*=.9;d.gestureTimer=0;}
                if(!detected)d.turboLock=false;
                if (Math.abs(d.targetSteer) < .055) d.targetSteer = 0;
                const release = d.targetSteer === 0;
                const response = release ? .48 : PHYSICS.steerSensitivity / Math.pow(Math.max(.5, char.weight), .25);
                d.steer += (d.targetSteer - d.steer) * response;
                if (Math.abs(d.steer) < .001) d.steer = 0;
            }

            const absX = Math.abs(d.playerX); let currentGrip = PHYSICS.gripAsphalt; let currentDrag = CONF.FRICTION; d.vibration = 0;
            const carScaleGlobal = w * 0.0022;
            const partY = (d.playerScreen?.y??h*.72) + (15 * carScaleGlobal) + 5;
            
            let offroadDrag = CONF.OFFROAD_DECEL;
            if (activeKart.type === 'monster') offroadDrag = 0.95;
            if (activeKart.type === 'tractor') offroadDrag = 0.96;
            if (activeKart.type === 'tank') offroadDrag = 0.97; 

            if (char.tireLevel > 1) { offroadDrag += (char.tireLevel - 1) * 0.015; }
            if (offroadDrag > CONF.FRICTION) offroadDrag = CONF.FRICTION;

            if (absX > 1.45) { 
                currentGrip = PHYSICS.gripOffroad; currentDrag = offroadDrag; d.vibration = 5; 
                if (char.suspensionLevel > 1) d.vibration -= (char.suspensionLevel - 1) * 1.5; 
                if(d.speed > 50) d.speed *= 0.98; if(d.speed > 10) this.spawnParticle(w/2 + (Math.random()-0.5)*40, partY, 'dust'); 
            } else if (absX > 1.0) { currentGrip = PHYSICS.gripZebra; d.vibration = 2; }

            let max = CONF.MAX_SPEED * char.speedInfo;
            if (d.turboLock) {
                max = CONF.TURBO_MAX_SPEED; d.nitro -= 0.5; this.spawnParticle((d.playerScreen?.x??w/2)-12,partY,'turbo');this.spawnParticle((d.playerScreen?.x??w/2)+12,partY,'turbo');
                if (d.nitro <= 0) { d.nitro = 0; d.turboLock = false; window.Sfx.play(200, 'sawtooth', 0.5, 0.2); } 
            } else { d.nitro = Math.min(100, d.nitro + 0.15); }

            const isAccelerating = d.inputActive;
            if(d.status === 'RACING' && d.spinTimer <= 0 && isAccelerating) { d.speed += (max - d.speed) * char.accel; } else if (d.status !== 'FINISHED') { d.speed *= 0.96; }
            d.speed *= currentDrag;
            if(window.ArcadeControls?.mode==="controls" && d.arcadeManual?.brake && d.status==="RACING"){
                d.speed=Math.max(0,d.speed*.86);
                d.turboLock=false;
            }

            if (d.spinTimer > 0) { 
                d.spinTimer--; 
                d.spinAngle += (Math.PI * 2) / 40; 
                d.speed *= 0.95; 
                d.bounce *= 0.85; 
            } else {
                d.spinAngle = 0; 
                d.bounce = (Math.random() - 0.5) * d.vibration; 
            }

            if ((window.ArcadeControls?.mode==='controls' ? d.arcadeManual?.drift && Math.abs(d.targetSteer) > .2 : Math.abs(d.targetSteer) > .5) && d.speed > 100 && absX < 1.3 && d.spinTimer <= 0) {
                d.driftSparks = Math.min((d.driftSparks || 0) + 1, 100);
                if (Math.random() > 0.3) this.spawnParticle(w/2 + (d.targetSteer > 0 ? -30 : 30), partY, d.driftSparks > 70 ? 'drift_blue' : 'drift_yellow');
            } else if (d.driftSparks > 0) {
                if (d.driftSparks > 70) { d.driftBoosts=(d.driftBoosts||0)+1; d.speed = Math.min(CONF.TURBO_MAX_SPEED, d.speed + 60); window.Sfx.play(600, 'square', 0.2, 0.2); d.vibration = 8; this.pushMsg("DRIFT BOOST!", "#0ff", 30); }
                d.driftSparks = 0;
            }

            let inVacuo = false;
            d.rivals.forEach(r => {
                const distZ = ((Number(r.lap) * trackLength) + Number(r.pos)) - ((d.lap * trackLength) + d.pos);
                if (distZ > 80 && distZ < 600 && Math.abs(r.x - d.playerX) < 0.3 && r.status === 'RACING') inVacuo = true;
            });
            if (inVacuo && d.speed > 90) {
                d.slipstreamTimer = (d.slipstreamTimer || 0) + 1;
                if (d.slipstreamTimer > 20) { d.speed += 3.5; if (Math.random() > 0.4) this.spawnParticle(w/2 + (Math.random()-0.5)*200, h/2 + Math.random()*150, 'wind'); }
            } else { d.slipstreamTimer = 0; }

            // --- MAGNETISMO E HITBOX AUMENTADA ---
            const pickupHitbox = .23;
            for (let i = 0; i <= 1; i++) {
                const segInfo = getSegment((d.pos / CONF.SEGMENT_LENGTH) + i);
                if (segInfo.obs) {
                    segInfo.obs.forEach(o => {
                        if (!o.collected) {
                            let dist = Math.abs(d.playerX - o.x);
                            
                            // Efeito Magnético: Atrai o item pro jogador se estiver proximo
                            if(dist<.62&&o.type!=='banana') {
                                o.x+=(d.playerX-o.x)*.06;
                                dist = Math.abs(d.playerX - o.x);
                            }

                            if (dist < pickupHitbox) {
                                if (o.type === 'coin') {
                                    o.collected = true; d.matchCoins++; d.score += 50; window.Sfx.coin(); 
                                    if (window.Profile) { window.Profile.coins = (Number(window.Profile.coins) || 0) + 1000; if(window.Profile.save) window.Profile.save(); }
                                } else if (o.type === 'item_box' && !d.item) {
                                    o.collected = true; window.Sfx.play(1000, 'sine', 0.1);
                                    const possibleItems = ['mushroom', 'banana', 'shell'];
                                    d.item = possibleItems[Math.floor(Math.random() * possibleItems.length)];
                                    this.pushMsg("CAIXA PEGA!", "#fff", 30);
                                } else if (o.type === 'banana') {
                                    // Imunidade de Dono da Banana (1.5 segundos após jogar)
                                    if (o.owner === this.networkId && (this.networkNow() - o.time < 1500)) return;

                                    o.collected = true; d.spinTimer = 40; d.speed *= 0.2; window.Sfx.error(); window.Gfx.shakeScreen(20);
                                    this.pushMsg("ESCORREGOU!", "#f00", 40);
                                    
                                    // Remove the hazard globally
                                    if (this.isOnline && this.roomRef && o.id) {
                                        this.roomRef.child('shared/hazards/' + o.id).remove();
                                    }
                                }
                            }
                        }
                    });
                }
            }

            if (itemTriggered && d.item && d.itemCooldown <= 0 && d.status === 'RACING') {
                if (d.item === 'mushroom') {
                    d.speed = Math.min(CONF.TURBO_MAX_SPEED + 50, d.speed + 150);
                    window.Gfx.shakeScreen(15); window.Sfx.play(800, 'square', 0.3, 0.2);
                    this.pushMsg("ITEM: TURBO!", "#f1c40f",18);
                } 
                else if (d.item === 'banana') {
                    // Joga a banana pra trás
                    let dropPos = d.pos - (CONF.SEGMENT_LENGTH * 2);
                    if (dropPos < 0) dropPos += trackLength;
                    let segInfo = getSegment(dropPos / CONF.SEGMENT_LENGTH);
                    if (!segInfo.obs) segInfo.obs = [];
                    
                    let hazId = 'b_' + this.networkId + '_' + Date.now();
                    segInfo.obs.push({ id: hazId, type: 'banana', x: d.playerX, collected: false, owner: this.networkId, time: this.networkNow() });
                    window.Sfx.play(300, 'sine', 0.2, 0.2);
                    this.pushMsg("BANANA DROPADA!", "#f1c40f");

                    if (this.isOnline && this.roomRef) {
                        this.roomRef.child('shared/hazards/' + hazId).set({ pos: dropPos, x: d.playerX, owner: this.networkId, time: this.networkNow(),matchId:this.lastStartedMatch });
                    }
                } 
                else if (d.item === 'shell') {
                    let ranks = this.getRankings();
                    let myIdx = ranks.findIndex(r => r.id === 'player');
                    let targetIdx = myIdx - 1; 
                    if (myIdx === 0) targetIdx = ranks.length - 1; 
                    let targetId = ranks[targetIdx] ? ranks[targetIdx].id : null;

                    this.spawnShell('player',targetId,d.pos+200,d.playerX,Math.max(d.speed,200)+150);
                    window.Sfx.play(600, 'sawtooth', 0.2, 0.2);
                    this.pushMsg("CASCO LANÇADO!", "#2ecc71"); // Adeus míssel
                }
                d.item = null; d.itemCooldown = 60; 
            }
            if (d.itemCooldown > 0) d.itemCooldown--;

            this.updateProjectiles(w,h,char,activeKart);

            KartAudio.update(d.speed, CONF.MAX_SPEED, d.lateralInertia, absX > 1.45, d.turboLock);

            // Track coordinates are half-road widths. Steering sets a bounded
            // lateral velocity instead of adding acceleration on every tick.
            // Releasing a button must stop a lane change, not keep it drifting.
            const ratio = Math.max(0, Math.min(1.35, d.speed / CONF.MAX_SPEED));
            const turnForce = d.steer * char.turnInfo * currentGrip * Math.sqrt(ratio);
            // The road turns under the axle: positive bends require right input.
            // Blend nearby segments to avoid a lateral jolt at a curve entrance.
            const segment=d.pos/CONF.SEGMENT_LENGTH,base=Math.floor(segment),fraction=segment-base;
            const sample=at=>{let sum=0;for(let i=-4;i<=4;i++)sum+=getSegment(at+i).curve*(5-Math.abs(i));return sum/25;};
            d.roadCurve=sample(base)*(1-fraction)+sample(base+1)*fraction;
            const curveDrift=-d.roadCurve*ratio*ratio*.0065;
            const help=STEERING_ASSISTS[playOptions().steeringAssist]||STEERING_ASSISTS.light;
            // Help reduces understeer and guards the edge. It never snaps to the
            // centre or overrides a deliberate lane change in either direction.
            const edge=Math.sign(d.playerX)*Math.max(0,Math.min(1,(Math.abs(d.playerX)-.65)/.7));
            d.steeringHelp=d.inputActive&&d.spinTimer<=0?-curveDrift*help.curve-edge*help.edge*(1-Math.min(1,Math.abs(d.targetSteer))):0;
            const targetLateral = Math.max(-PHYSICS.maxLateralSpeed, Math.min(PHYSICS.maxLateralSpeed, turnForce * PHYSICS.lateralSpeed+curveDrift+d.steeringHelp));
            const lateralResponse = d.targetSteer === 0 ? .48 : .30;
            d.lateralInertia += (targetLateral - d.lateralInertia) * lateralResponse;
            if (d.speed < 1 || Math.abs(d.lateralInertia) < .00001) d.lateralInertia = 0;
            d.playerX += d.lateralInertia;
            if(window.ArcadeControls?.mode==='controls'&&d.arcadeManual?.drift && Math.abs(d.lateralInertia) > .012 && d.speed > 100 && absX < 1.2) { this.spawnParticle(w/2 - 30, partY, 'smoke'); this.spawnParticle(w/2 + 30, partY, 'smoke'); }

            this.updateBotDrivers();

            const contacts = new Set();
            const previousContacts = d.collisionContacts || new Set();
            d.rivals.forEach(r => {
                const distZ = Math.abs(((d.lap * trackLength) + d.pos) - ((Number(r.lap) * trackLength) + Number(r.pos)));
                const contactId = r.id || r;
                const contactWidth = kartHalfWidth(activeKart.id) + kartHalfWidth(r.kartId || 0);
                // A little separation is required before another impact. This
                // prevents edge jitter from applying the same bump repeatedly.
                const separation = previousContacts.has(contactId) ? .025 : 0;
                if (distZ < 250 && Math.abs(r.x - d.playerX) < contactWidth + separation && r.status === 'RACING' && d.status === 'RACING') {
                    contacts.add(contactId);
                    if (previousContacts.has(contactId)) return;
                    const pushForce = .018 * Math.max(.5, Math.min(1.7, ((CHARACTERS[r.charId] || CHARACTERS[0]).weight / char.weight)));
                    d.lateralInertia = Math.max(-PHYSICS.maxLateralSpeed, Math.min(PHYSICS.maxLateralSpeed, d.lateralInertia + (d.playerX > r.x ? pushForce : -pushForce))); d.speed *= 0.94;
                    if (!r.isRemote && this.localBots.includes(r)) r.x += (d.playerX > r.x ? -.04 : .04);
                    KartAudio.crash();
                }
            });
            d.collisionContacts = contacts;
            d.playerX = Math.max(-1.8, Math.min(1.8, d.playerX));
            if (Math.abs(d.playerX) >= 1.8 && Math.sign(d.lateralInertia) === Math.sign(d.playerX)) d.lateralInertia = 0;
            d.cameraX += (d.playerX - d.cameraX) * CONF.CAMERA_LERP;
            d.pos += d.speed;

            if (d.pos > trackLength * 0.60 && d.pos < trackLength * 0.95) { d.maxLapPos = Math.max(d.maxLapPos, d.pos); }
            if (d.pos >= trackLength) { 
                if (d.maxLapPos > trackLength * 0.70) {
                    d.pos -= trackLength; d.lap++; d.maxLapPos = 0;
                    
                    d.player.lap++;
                    if (d.player.lap > d.totalLaps) {
                        d.raceState = "FINISHED";
                        d.player.finished = true;
                        d.reward = 1000 + (d.currentFase?.reqLvl || 1) * 250;
                        window.Sfx.play(1000, 'sine', 1, 0.5);
                    }

                    if (d.lap > CONF.TOTAL_LAPS) {
                        d.lap = CONF.TOTAL_LAPS; d.status = 'FINISHED'; if (d.finishTime === 0) d.finishTime = this.networkNow();
                        nitroBtn.style.display = 'none';
                        this.pushMsg("CRUZOU A LINHA!", "#ff0", 60);
                    } else { window.Sfx.play(700, 'square', 0.3, 0.1); this.pushMsg(`VOLTA ${d.lap}/${CONF.TOTAL_LAPS}`, "#fff", 60); }
                } else { d.pos = trackLength - 1; d.speed = 0; this.pushMsg("SENTIDO ERRADO!", "#f00"); }
            }
            
            d.visualTilt += ((d.steer * 8) - d.visualTilt) * 0.15; d.visualTilt = Math.max(-12, Math.min(12, d.visualTilt)); 
            
            d.score += d.speed * 0.01;
            particles.forEach((p, i) => { p.x += p.vx; p.y += p.vy; p.l--; if(p.l <= 0) particles.splice(i, 1); });
        },

        spawnParticle: function(x, y, type) {
            if (type === 'drift_yellow') { particles.push({ x, y, vx: (Math.random()-0.5)*8, vy: -Math.random()*5, l: 15, maxL: 15, c: '#f1c40f', isDrift: true }); return; }
            if (type === 'drift_blue') { particles.push({ x, y, vx: (Math.random()-0.5)*12, vy: -Math.random()*8, l: 20, maxL: 20, c: '#00d2d3', isDrift: true }); return; }
            if (type === 'wind') { particles.push({ x, y, vx: 0, vy: 15 + Math.random()*15, l: 10, maxL: 10, c: 'rgba(255,255,255,0.6)', isLine: true }); return; }
            if (type === 'explosion') {
                for(let i=0; i<15; i++) { particles.push({ x, y, vx: (Math.random()-0.5)*25, vy: (Math.random()-0.5)*25, l: 40, maxL: 40, c: ['#ff0000', '#ff9900', '#ffff00'][Math.floor(Math.random()*3)], isExplosion: true }); }
                return;
            }
            if(Math.random() > 0.5) return;
            particles.push({ x, y, vx: (Math.random()-0.5)*4, vy: (Math.random())*4, l: 20, maxL: 20, c: type==='turbo'?'#ffaa00':(type==='dust'?'#95a5a6':'#ecf0f1') });
        },

        cameraView: function(w,h){
            const opts=playOptions(),target={near:2.4,medium:4.5,far:7.5}[opts.distance]||7.5;
            this.cameraDepth=Number.isFinite(this.cameraDepth)?this.cameraDepth+(target-this.cameraDepth)*.1:target;
            const direction=window.ArcadeControls?.mode==='controls'&&this.arcadeManual?.rear?-1:1,depth=this.cameraDepth;
            const baseFloat=this.pos/CONF.SEGMENT_LENGTH-direction*depth;
            const base=direction===1?Math.floor(baseFloat):Math.ceil(baseFloat);
            return {depth,direction,base,fraction:Math.abs(baseFloat-base),horizon:h*.30,drawDistance:opts.quality==='low'?180:CONF.DRAW_DISTANCE};
        },
        renderWorld: function(ctx, w, h) {
            const d = Logic; const cx = w / 2; 
            const view=this.cameraView(w,h);
            const horizon=view.horizon;
            
            const currentSegIndex = view.base; const isOffRoad = Math.abs(d.playerX) > 1.2;
            const skyGrads = [['#3388ff', '#88ccff'], ['#e67e22', '#f1c40f'], ['#0984e3', '#74b9ff']];
            const currentSky = skyGrads[this.skyColor] || skyGrads[0];
            const gradSky = ctx.createLinearGradient(0, 0, 0, horizon);
            gradSky.addColorStop(0, currentSky[0]); gradSky.addColorStop(1, currentSky[1]);
            ctx.fillStyle = gradSky; ctx.fillRect(0, 0, w, horizon);

            const bgOffset = (getSegment(currentSegIndex).curve * 30) + (d.cameraX * 20); 
            ctx.fillStyle = this.skyColor === 0 ? '#44aa44' : (this.skyColor===1 ? '#d35400' : '#fff'); 
            ctx.beginPath(); ctx.moveTo(0, horizon);
            for(let i=0; i<=12; i++) { ctx.lineTo((w/12 * i) - (bgOffset * 0.5), horizon - 50 - Math.abs(Math.sin(i + d.pos*0.0001))*40); }
            ctx.lineTo(w, horizon); ctx.fill();

            const themes = { 'grass': ['#55aa44', '#448833'], 'sand':  ['#f1c40f', '#e67e22'], 'snow':  ['#ffffff', '#dfe6e9'] };
            const theme = themes[TRACKS[d.selectedTrack].theme] || themes['grass']; 
            ctx.fillStyle = isOffRoad ? '#336622' : theme[1]; ctx.fillRect(0, horizon, w, h-horizon);

            const camX = d.cameraX * (w * 1.5), segmentCoords = [];
            // Integrate the road once, then express it in the tangent frame at
            // the player's axle. Curvature must not displace the player together
            // with a camera segment behind them (the old dx*n did exactly that).
            const road = [0], tangents = [0];
            for(let n=0;n<=view.drawDistance;n++){
                const bend=getSegment(currentSegIndex+view.direction*n).curve;
                tangents.push(tangents[n]+bend*view.direction*w*.0028);
                road.push(road[n]+tangents[n]);
            }
            const axle=view.depth+view.fraction, ai=Math.floor(axle), af=axle-ai;
            const anchor=road[ai]+(road[ai+1]-road[ai])*af;
            const tangent=tangents[ai]+(tangents[ai+1]-tangents[ai])*af;
            const roadX=(n,scale)=>cx+(road[n]-anchor-(n-axle)*tangent-camX)*scale;

            for(let n = 0; n < view.drawDistance; n++) {
                const seg = getSegment(currentSegIndex + view.direction*n);
                const scale = 1 / (1 + Math.max(.05,n-view.fraction) * .22);
                const nextScale = 1 / (1 + Math.max(.05,n+1-view.fraction) * .22);
                const sy = horizon + ((h*1.2 - horizon) * scale); const nsy = horizon + ((h*1.2 - horizon) * nextScale);
                const sx=roadX(n,scale),nsx=roadX(n+1,nextScale);
                segmentCoords.push({x:sx,y:sy,scale,halfWidth:w*1.5*scale});
                ctx.fillStyle = (seg.color === 'dark') ? (isOffRoad?'#336622':theme[1]) : (isOffRoad?'#336622':theme[0]); ctx.fillRect(0, nsy, w, sy - nsy);
                ctx.fillStyle = (seg.color === 'dark') ? '#f33' : '#fff'; 
                ctx.beginPath(); ctx.moveTo(sx - (w*3*scale)*0.6, sy); ctx.lineTo(sx + (w*3*scale)*0.6, sy); ctx.lineTo(nsx + (w*3*nextScale)*0.6, nsy); ctx.lineTo(nsx - (w*3*nextScale)*0.6, nsy); ctx.fill();
                ctx.fillStyle = (seg.color === 'dark') ? '#35424f' : '#3d4c5b';
                ctx.beginPath(); ctx.moveTo(sx - (w*3*scale)*0.5, sy); ctx.lineTo(sx + (w*3*scale)*0.5, sy); ctx.lineTo(nsx + (w*3*nextScale)*0.5, nsy); ctx.lineTo(nsx - (w*3*nextScale)*0.5, nsy); ctx.fill();
                if(((currentSegIndex+n)%14)<5){
                    const stripeWidth=w*3*.013;
                    ctx.fillStyle='rgba(221,236,250,.35)';
                    ctx.beginPath();ctx.moveTo(sx-stripeWidth*scale,sy);
                    ctx.lineTo(sx+stripeWidth*scale,sy);
                    ctx.lineTo(nsx+stripeWidth*nextScale,nsy);
                    ctx.lineTo(nsx-stripeWidth*nextScale,nsy);ctx.fill();
                }
            }

            for(let n = view.drawDistance - 1; n >= 0; n--) {
                const coord = segmentCoords[n]; if(!coord) continue;
                
                const seg = getSegment(currentSegIndex + view.direction*n);
                if (seg.obs) {
                    seg.obs.forEach(o => {
                        if (o.collected) return;
                        let ox = coord.x + (o.x * (w*1.5) * coord.scale);
                        let oy = coord.y - (30 * coord.scale);
                        let sc = coord.scale;
                        
                        if (o.type === 'coin') {
                            oy += Math.sin(Date.now()*0.005)*10*sc;
                            let r = 50 * sc; 
                            let w_spin = r * Math.abs(Math.cos(Date.now()*0.005));
                            ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.ellipse(ox, oy, Math.max(1, w_spin), r, 0, 0, Math.PI*2); ctx.fill();
                            ctx.strokeStyle = '#f39c12'; ctx.lineWidth = 5*sc; ctx.stroke();
                        } 
                        else if (o.type === 'item_box') {
                            oy += Math.sin(Date.now()*0.005)*10*sc;
                            let hue = (Date.now() / 5) % 360; 
                            ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
                            ctx.fillRect(ox - 65*sc, oy - 65*sc, 130*sc, 130*sc); 
                            ctx.fillStyle = '#fff'; ctx.font = `bold ${80*sc}px Arial`; ctx.textAlign='center';
                            ctx.fillText("?", ox, oy + 30*sc);
                        }
                        else if (o.type === 'banana') {
                            ctx.fillStyle = '#f1c40f'; 
                            ctx.beginPath(); ctx.ellipse(ox, oy + 25*sc, 50*sc, 18*sc, 0, 0, Math.PI*2); ctx.fill(); 
                            ctx.beginPath(); ctx.ellipse(ox, oy + 10*sc, 18*sc, 50*sc, 0, 0, Math.PI*2); ctx.fill();
                        }
                    });
                }

                // Actual rivals only: use authoritative lap + track positions.
                d.rivals.forEach(r => {
                    const ahead=((Number(r.lap)-Number(d.lap))*trackLength+Number(r.pos)-Number(d.pos))*view.direction+view.depth*CONF.SEGMENT_LENGTH;
                    if(!Number.isFinite(ahead)||ahead<=0||ahead>=view.drawDistance*CONF.SEGMENT_LENGTH)return;
                    const posAhead=ahead/CONF.SEGMENT_LENGTH;
                    if(Math.floor(posAhead+view.fraction)!==n)return;
                    const t=Math.max(0,Math.min(1,posAhead+view.fraction-n));
                    const far=segmentCoords[Math.min(n+1,segmentCoords.length-1)]||coord;
                    const lerp=(a,b,t)=>a+(b-a)*t;
                    const scale=lerp(coord.scale,far.scale,t);
                    const screenX=lerp(coord.x,far.x,t)+(Number(r.x)||0)*w*1.5*scale;
                    const spriteScale=Math.max(w*.00006,w*.0022*scale*1.55);
                    this.drawKartSprite(ctx,screenX,lerp(coord.y,far.y,t),spriteScale,0,0,r.spinAngle||0,r.color,r.charId,r.kartId);
                    if(scale>.025){ctx.save();ctx.font='bold '+Math.max(10,Math.min(13,w*.028))+'px Arial';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.shadowColor='#001';ctx.shadowBlur=4;ctx.fillText(String(r.name||'RIVAL').slice(0,16),screenX,lerp(coord.y,far.y,t)-130*spriteScale-9);ctx.restore();}
                });
            }

            d.projectiles.forEach(p => {
                if (!p.active) return;
                let relPos = (p.pos - d.pos)*view.direction+view.depth*CONF.SEGMENT_LENGTH; if (relPos < 0) relPos += trackLength;
                let n = Math.floor(relPos / CONF.SEGMENT_LENGTH);
                if (n > 0 && n < CONF.DRAW_DISTANCE) {
                    let coord = segmentCoords[n];
                    if (coord) {
                        let px = coord.x + (p.x * (w*1.5) * coord.scale);
                        let py = coord.y - (15 * coord.scale);
                        ctx.fillStyle = '#2ecc71'; 
                        ctx.beginPath(); ctx.ellipse(px, py, 45*coord.scale, 35*coord.scale, 0, 0, Math.PI*2); ctx.fill();
                        ctx.strokeStyle = '#ecf0f1'; ctx.lineWidth = 6*coord.scale; ctx.stroke();
                    }
                }
            });

            particles.forEach(p => {
                ctx.fillStyle = p.c; ctx.globalAlpha = p.l / p.maxL;
                if (p.isLine) { ctx.strokeStyle = p.c; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - 60); ctx.stroke(); } 
                else if (p.isDrift) { ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI*2); ctx.fill(); } 
                else if (p.isExplosion) { ctx.beginPath(); ctx.arc(p.x, p.y, (p.maxL - p.l)*3, 0, Math.PI*2); ctx.fill(); }
                else { ctx.beginPath(); ctx.arc(p.x,p.y,(2+(p.maxL-p.l)*.12)*Math.max(.5,(d.playerScreen?.scale||.4)*1.55),0,Math.PI*2); ctx.fill(); }
            }); ctx.globalAlpha = 1;

            if (d.status !== 'FINISHED' && d.state !== 'GAMEOVER') {
                let myKartId = (this.useCustomKart && this.garage[this.activeKartIdx]) ? this.garage[this.activeKartIdx].modelId : 0;
                const at=view.depth+view.fraction, index=Math.floor(at),t=at-index;
                const a=segmentCoords[index],b=segmentCoords[index+1]||a;
                if(a){const scale=a.scale+(b.scale-a.scale)*t;
                  const x=a.x+(b.x-a.x)*t+d.playerX*w*1.5*scale,y=a.y+(b.y-a.y)*t;
                  this.playerScreen={x,y,scale,roadX:a.x+(b.x-a.x)*t,roadHalfWidth:w*1.5*scale};
                  this.drawKartSprite(ctx,x,y+d.bounce,w*.0022*scale*1.55,d.steer,d.visualTilt*.45,d.spinAngle,CHARACTERS[d.selectedChar].color,d.selectedChar,myKartId);
                }
                if(d.arcadeManual?.rear){ctx.save();ctx.font='bold 12px Arial';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText('OLHANDO PARA TRÁS',w/2,h*.27);ctx.restore();}
            }
        },

        drawKartSprite: function(ctx, cx, y, carScale, steer, tilt, spinAngle, color, charId, kartModelId = 0) {
            ctx.save(); ctx.translate(cx, y); ctx.scale(carScale, carScale); 
            ctx.rotate(tilt * 0.03 + spinAngle); 
            
            const w = (CHARACTERS[charId] || CHARACTERS[0]).weight;
            const kartModel = KART_MODELS[kartModelId] || KART_MODELS[0];

            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(0, 35, w > 1.2 ? 75 : (w < 0.9 ? 55 : 65), 15, 0, 0, Math.PI*2); ctx.fill();

            const drawWheels = (wWidth, wHeight, colorObj, offset = 0) => {
                const dw = (wx, wy, isFront) => { ctx.save(); ctx.translate(wx, wy); if(isFront) ctx.rotate(steer * 0.8); ctx.fillStyle = colorObj || '#111'; ctx.fillRect(-wWidth/2, -wHeight/2, wWidth, wHeight); ctx.fillStyle = '#555'; ctx.fillRect(-wWidth/2 + 3, -wHeight/2 + 3, wWidth - 6, wHeight - 6); ctx.restore(); };
                dw(-45 - offset, 15, false); dw(45 + offset, 15, false); dw(-40 - offset, -15, true); dw(40 + offset, -15, true);
            };

            if (kartModel.type !== 'standard') {
                if (kartModel.type === 'f1') {
                    drawWheels(22, 35, '#111', 15);
                    ctx.fillStyle = kartModel.color;
                    ctx.beginPath(); ctx.moveTo(-10, -55); ctx.lineTo(10, -55); ctx.lineTo(25, 20); ctx.lineTo(-25, 20); ctx.fill();
                    ctx.fillStyle = '#111'; ctx.fillRect(-45, 10, 90, 15); 
                    ctx.fillStyle = '#f1c40f'; ctx.fillRect(-25, -55, 50, 8); 
                } 
                else if (kartModel.type === 'luxury') {
                    drawWheels(25, 35, '#222', 10);
                    let grad = ctx.createLinearGradient(0, -40, 0, 25); grad.addColorStop(0, kartModel.color); grad.addColorStop(1, '#000');
                    ctx.fillStyle = grad;
                    if(ctx.roundRect) { ctx.beginPath(); ctx.roundRect(-28, -40, 56, 75, 15); ctx.fill(); } else { ctx.fillRect(-28, -40, 56, 75); }
                    ctx.fillStyle = '#111'; if(ctx.roundRect) { ctx.beginPath(); ctx.roundRect(-22, -15, 44, 30, 5); ctx.fill(); } else { ctx.fillRect(-22, -15, 44, 30); } 
                    ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.arc(-18, -35, 4, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(18, -35, 4, 0, Math.PI*2); ctx.fill(); 
                    ctx.fillStyle = '#e74c3c'; ctx.fillRect(-22, 32, 12, 3); ctx.fillRect(10, 32, 12, 3); 
                }
                else if (kartModel.type === 'moto') {
                    const dwMoto = (wx, wy, isFront) => { ctx.save(); ctx.translate(wx, wy); if(isFront) ctx.rotate(steer * 0.8); ctx.fillStyle = '#111'; ctx.fillRect(-10, -20, 20, 40); ctx.restore(); };
                    dwMoto(0, 30, false); dwMoto(0, -40, true);
                    ctx.fillStyle = kartModel.color;
                    ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(-12, 10); ctx.lineTo(12, 10); ctx.fill(); 
                    ctx.fillStyle = '#bdc3c7'; ctx.fillRect(-20, -25, 40, 4); 
                }
                else if (kartModel.type === 'tractor') {
                    const dwTrac = (wx, wy, isFront, wW, wH) => { ctx.save(); ctx.translate(wx, wy); if(isFront) ctx.rotate(steer * 0.8); ctx.fillStyle = '#111'; ctx.fillRect(-wW/2, -wH/2, wW, wH); ctx.fillStyle='#555'; ctx.fillRect(-wW/2+4, -wH/2+4, wW-8, wH-8); ctx.restore(); };
                    dwTrac(-40, 15, false, 30, 50); dwTrac(40, 15, false, 30, 50); 
                    dwTrac(-30, -35, true, 20, 30); dwTrac(30, -35, true, 20, 30); 
                    ctx.fillStyle = kartModel.color; ctx.fillRect(-15, -40, 30, 50); 
                    ctx.fillStyle = '#333'; ctx.fillRect(-20, 0, 40, 30); 
                    ctx.fillStyle = '#7f8c8d'; ctx.fillRect(10, -35, 4, 15); 
                }
                else if (kartModel.type === 'tank') {
                    ctx.fillStyle = '#2d3436'; 
                    if(ctx.roundRect) { ctx.beginPath(); ctx.roundRect(-45, -35, 20, 70, 5); ctx.fill(); ctx.beginPath(); ctx.roundRect(25, -35, 20, 70, 5); ctx.fill(); } else { ctx.fillRect(-45, -35, 20, 70); ctx.fillRect(25, -35, 20, 70); }
                    ctx.fillStyle = '#000'; for(let i=-30; i<35; i+=8) { ctx.fillRect(-45, i, 20, 3); ctx.fillRect(25, i, 20, 3); } 
                    
                    ctx.fillStyle = kartModel.color; ctx.fillRect(-25, -30, 50, 60); 
                    ctx.fillStyle = '#111'; ctx.fillRect(-4, -60, 8, 40); 
                    ctx.fillStyle = '#34495e'; ctx.beginPath(); ctx.arc(0, -10, 18, 0, Math.PI*2); ctx.fill(); 
                }
                else if (kartModel.type === 'plane') {
                    ctx.fillStyle = '#111'; ctx.fillRect(-12, 10, 6, 12); ctx.fillRect(6, 10, 6, 12); ctx.fillRect(-3, -40, 6, 12); 
                    ctx.fillStyle = kartModel.color; ctx.beginPath(); ctx.ellipse(0, -10, 18, 50, 0, 0, Math.PI*2); ctx.fill(); 
                    ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.moveTo(-60, 5); ctx.lineTo(60, 5); ctx.lineTo(0, -15); ctx.fill(); 
                    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(-25, 35); ctx.lineTo(25, 35); ctx.lineTo(0, 20); ctx.fill(); 
                    ctx.save(); ctx.translate(0, -60); ctx.rotate(Date.now() * 0.05); ctx.fillStyle = '#bdc3c7'; ctx.fillRect(-20, -2, 40, 4); ctx.restore(); 
                }
                else if (kartModel.type === 'sport') {
                    drawWheels(18, 28, '#2c3e50', 5);
                    ctx.fillStyle = kartModel.color; ctx.beginPath(); ctx.ellipse(0, 0, 35, 45, 0, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-10, -40); ctx.lineTo(10, -40); ctx.lineTo(0, 20); ctx.fill(); 
                }

                ctx.save(); 
                let headY = -10;
                if (kartModel.type === 'moto') { headY = 10; ctx.translate(steer * -15, 0); } 
                else if (kartModel.type === 'f1') headY = 0;
                else if (kartModel.type === 'tank') headY = 5;
                else if (kartModel.type === 'tractor') headY = 15; 
                else if (kartModel.type === 'plane') headY = -5;
                else if (kartModel.type === 'luxury') headY = -10; 

                ctx.translate(0, headY);
                drawCharacterHead(ctx, charId, steer);
                ctx.restore();
                ctx.restore();
                return;
            }

            if ((CHARACTERS[charId] || CHARACTERS[0]).name === 'ROCHA') {
                drawWheels(28, 38, '#2c3e50');
            } else if ((CHARACTERS[charId] || CHARACTERS[0]).name === 'ATLAS') {
                drawWheels(34, 44);
            } else if ((CHARACTERS[charId] || CHARACTERS[0]).name === 'BOLT') {
                drawWheels(18, 28, '#27ae60');
            } else if ((CHARACTERS[charId] || CHARACTERS[0]).name === 'LUMI') {
                drawWheels(16, 26, '#ecf0f1');
            } else if ((CHARACTERS[charId] || CHARACTERS[0]).name === 'VÓRTEX') {
                drawWheels(26, 32); 
            } else if ((CHARACTERS[charId] || CHARACTERS[0]).name === 'PIPO') {
                drawWheels(14, 22);
            } else {
                drawWheels(20, 30);
                ctx.fillStyle = '#95a5a6'; ctx.fillRect(-15, 15, 30, 18); ctx.strokeStyle = (CHARACTERS[charId] || CHARACTERS[0]).color; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-25, -20); ctx.lineTo(25, -20); ctx.lineTo(35, 10); ctx.lineTo(-35, 10); ctx.closePath(); ctx.stroke();
            }

            // V8 kart silhouette: dimensional rear body, cockpit and reflectors.
            // The original character head stays mounted above the kart unchanged.
            ctx.save();
            const hull=ctx.createLinearGradient(0,-35,0,37);
            hull.addColorStop(0,'#ffdfe0');
            hull.addColorStop(.18,color||'#ef5258');
            hull.addColorStop(.62,color||'#d23845');
            hull.addColorStop(1,'#4a1b33');
            ctx.shadowColor='rgba(0,0,0,.38)';ctx.shadowBlur=7;
            ctx.fillStyle='#263846';
            ctx.beginPath();ctx.moveTo(-37,16);ctx.lineTo(37,16);ctx.lineTo(40,31);ctx.lineTo(-40,31);ctx.closePath();ctx.fill();
            ctx.shadowBlur=0;ctx.fillStyle=hull;
            ctx.beginPath();ctx.moveTo(-30,-26);ctx.quadraticCurveTo(-36,-8,-37,15);
            ctx.lineTo(-31,32);ctx.quadraticCurveTo(0,40,31,32);
            ctx.lineTo(37,15);ctx.quadraticCurveTo(36,-8,30,-26);ctx.closePath();ctx.fill();
            const center=ctx.createLinearGradient(-15,0,15,0);
            center.addColorStop(0,'rgba(14,24,45,.92)');
            center.addColorStop(.45,'rgba(52,74,96,.96)');
            center.addColorStop(1,'rgba(9,20,35,.94)');
            ctx.fillStyle=center;
            ctx.beginPath();ctx.ellipse(0,-7,22,25,0,0,Math.PI*2);ctx.fill();
            ctx.strokeStyle='rgba(248,254,255,.72)';ctx.lineWidth=1.7;
            ctx.beginPath();ctx.ellipse(0,-7,22,25,0,0,Math.PI*2);ctx.stroke();
            // Painted side fenders and clear reflections respond to the track lighting.
            ctx.fillStyle='rgba(255,255,255,.28)';
            ctx.beginPath();ctx.moveTo(-29,-19);ctx.lineTo(-24,-27);ctx.lineTo(-19,6);ctx.lineTo(-25,21);ctx.closePath();ctx.fill();
            ctx.beginPath();ctx.moveTo(29,-19);ctx.lineTo(24,-27);ctx.lineTo(19,6);ctx.lineTo(25,21);ctx.closePath();ctx.fill();
            ctx.fillStyle='#ffe3b2';
            for(const side of [-1,1]){ctx.beginPath();ctx.ellipse(side*28,26,6.5,3.8,0,0,Math.PI*2);ctx.fill();}
            ctx.strokeStyle='#cbeaff';ctx.lineWidth=2;
            ctx.beginPath();ctx.moveTo(-23,32);ctx.lineTo(23,32);ctx.stroke();
            ctx.fillStyle='#f3f8ff';ctx.font='900 15px system-ui';ctx.textAlign='center';
            ctx.fillText(String((CHARACTERS[charId]||CHARACTERS[0]).name||'K')[0],0,28);
            ctx.restore();
            drawCharacterHead(ctx, charId, steer);
            ctx.restore();
        },

        renderVirtualWheel: function(ctx){
            const d=Logic;
            if(window.ArcadeControls?.mode==='controls'||d.virtualWheel.opacity<=.01)return;
            ctx.save(); ctx.globalAlpha = d.virtualWheel.opacity; ctx.translate(d.virtualWheel.x, d.virtualWheel.y);
            if (d.virtualWheel.isHigh) { ctx.shadowBlur = 25; ctx.shadowColor = '#0ff'; }
            ctx.rotate(d.steer * 0.6); ctx.beginPath(); ctx.arc(0, 0, d.virtualWheel.r, 0, Math.PI * 2); ctx.lineWidth = 18; ctx.strokeStyle = '#2d3436'; ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, d.virtualWheel.r, -Math.PI * 0.25, -Math.PI * 0.75, true); ctx.lineWidth = 18; ctx.strokeStyle = '#d63031'; ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, d.virtualWheel.r, Math.PI * 0.25, Math.PI * 0.75, false); ctx.strokeStyle = '#d63031'; ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-d.virtualWheel.r + 10, 0); ctx.lineTo(d.virtualWheel.r - 10, 0); ctx.moveTo(0, 0); ctx.lineTo(0, d.virtualWheel.r - 10); ctx.lineWidth = 12; ctx.strokeStyle = '#bdc3c7'; ctx.lineCap = 'round'; ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fillStyle = '#2d3436'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#bdc3c7'; ctx.stroke();
            ctx.fillStyle = '#d63031'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('GT', 0, 1); ctx.restore();
        },
        renderRaceHUD: function(ctx,w,h){
            const d=Logic,assist=(STEERING_ASSISTS[playOptions().steeringAssist]||STEERING_ASSISTS.light).label;
            const width=Math.max(150,Math.min(234,w-166)),x=12,y=10;
            ctx.save();ctx.fillStyle='rgba(5,20,31,.84)';
            if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,width,49,10);ctx.fill();}else ctx.fillRect(x,y,width,49);
            ctx.textAlign='left';ctx.fillStyle='#eef7f2';ctx.font='bold 14px Arial';
            ctx.fillText(d.finalRank+'º  ·  VOLTA '+d.lap+'/'+CONF.TOTAL_LAPS,x+10,y+18,width-20);
            ctx.font='bold 10px Arial';ctx.fillStyle='#b9d8da';
            ctx.fillText('VEL '+Math.floor(d.speed)+'  ·  AUX '+assist.toUpperCase(),x+10,y+34,width-20);
            ctx.fillStyle='#223d4c';ctx.fillRect(x+10,y+40,width-20,3);
            ctx.fillStyle=d.turboLock?'#7de6f1':'#efb76b';ctx.fillRect(x+10,y+40,(width-20)*d.nitro/100,3);
            if(d.item){ctx.textAlign='center';ctx.font='22px Arial';ctx.fillStyle='#fff';ctx.fillText(d.item==='mushroom'?'🍄':d.item==='banana'?'🍌':'🐢',x+width-22,y+23);}
            if(minimapPath.length){
                const size=h<500?64:74,mx=12,my=72;ctx.fillStyle='rgba(5,20,31,.56)';ctx.fillRect(mx,my,size,size);
                ctx.save();ctx.beginPath();ctx.rect(mx,my,size,size);ctx.clip();
                ctx.translate(mx+size/2,my+size/2);const scale=Math.min((size-14)/minimapBounds.w,(size-14)/minimapBounds.h);
                ctx.scale(scale,scale);ctx.translate(-(minimapBounds.minX+minimapBounds.maxX)/2,-(minimapBounds.minZ+minimapBounds.maxZ)/2);
                ctx.strokeStyle='#b7d4d5';ctx.lineWidth=1.4/scale;ctx.beginPath();minimapPath.forEach((p,i)=>i?ctx.lineTo(p.x,p.z):ctx.moveTo(p.x,p.z));ctx.closePath();ctx.stroke();
                const dot=(pos,color,r)=>{const p=minimapPath[Math.floor(pos/trackLength*minimapPath.length)%minimapPath.length];if(p){ctx.fillStyle=color;ctx.beginPath();ctx.arc(p.x,p.z,r/scale,0,Math.PI*2);ctx.fill();}};
                for(const r of d.rivals)dot(r.pos,'#e1c788',1.8);dot(d.pos,'#91f2d1',2.8);ctx.restore();
            }
            hudMessages=hudMessages.filter(m=>m.life>0);const message=hudMessages.at(-1);
            if(message){const cy=h<500?89:106,maxWidth=Math.min(360,w*.62);ctx.textAlign='center';ctx.font='bold 13px Arial';
                const mw=Math.min(maxWidth,ctx.measureText(message.text).width+24);ctx.fillStyle='rgba(5,20,31,.82)';ctx.fillRect((w-mw)/2,cy-16,mw,27);ctx.fillStyle=message.color;ctx.fillText(message.text,w/2,cy+2,mw-16);}
            for(const m of hudMessages)m.life--;
            if(d.driftSparks>0){const ready=d.driftSparks>70;ctx.textAlign='center';ctx.font='bold 11px Arial';ctx.fillStyle=ready?'#9beee8':'#ebd5a5';ctx.fillText(ready?'SOLTE O DRIFT · IMPULSO PRONTO':'DRIFT · '+Math.min(100,Math.floor(d.driftSparks/70*100))+'%',w/2,h*.76,Math.min(320,w-20));}
            if(window.ArcadeControls?.mode==='camera'&&d.item){ctx.fillStyle='#e5f7eb';ctx.textAlign='center';ctx.font='bold 12px Arial';const progress=d.cameraItemGesture?.progress||0;ctx.fillText(progress?'USANDO ITEM · '+Math.round(progress*100)+'%':d.cameraItemGesture?.consumed?'VOLTE A MÃO AO VOLANTE PARA USAR OUTRO ITEM':!d.cameraItemGesture?.armed?'MANTENHA AS DUAS MÃOS NO VOLANTE PARA PREPARAR':'ITEM: LEVE UMA MÃO À CABEÇA POR 0,35s',w/2,h<500?h*.79:h*.84,w-24);}
            if(d.trackingLost&&d.status==='RACING'){ctx.fillStyle='rgba(6,18,32,.88)';ctx.fillRect(w*.08,h*.40,w*.84,64);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 15px Arial';ctx.fillText('CÂMERA SEM PILOTO',w/2,h*.40+24,w*.8);ctx.font='12px Arial';ctx.fillText('Mostre as duas mãos para acelerar e dirigir.',w/2,h*.40+46,w*.8);}
            ctx.restore();
        },
        renderUI: function(ctx, w, h) {
            const d = Logic;
            const racing=d.state==='RACE'&&d.raceState!=='FINISHED';document.body?.classList?.toggle('kart-racing',racing);
            if(racing){this.renderVirtualWheel(ctx);this.renderRaceHUD(ctx,w,h);return;}
            hudMessages = hudMessages.filter(m => m.life > 0);
            // Compact notifications above the driving view, never over the kart.
            hudMessages.slice(-2).forEach((m,i)=>{
                ctx.save();
                const font=Math.round(Math.min(19,Math.max(11,w*.026,h*.034)));
                const label=String(m.text||"").slice(0,55);
                const y=Math.min(h*.16,108)+i*(font+10);
                ctx.textAlign="center";ctx.textBaseline="middle";
                ctx.font="900 "+font+"px Arial";
                const measured=Math.min(w-24,ctx.measureText(label).width+27);
                ctx.fillStyle="rgba(5,21,39,.82)";
                if(ctx.roundRect){ctx.beginPath();ctx.roundRect((w-measured)/2,y-font*.9,measured,font+12,8);ctx.fill()}
                else ctx.fillRect((w-measured)/2,y-font*.9,measured,font+12);
                ctx.fillStyle=m.color||"#f7faff";
                ctx.fillText(label,w/2,y+2,Math.max(80,w-40));
                ctx.restore();
                m.life--;
            });

            if (d.state === 'GAMEOVER') return; 

            if (ctx.roundRect) {
                ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.beginPath(); ctx.roundRect(20, 100, 70, 70, 15); ctx.fill();
                ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 3; ctx.stroke();
            } else {
                ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(20, 100, 70, 70);
            }

            if(d.driftSparks>0){ctx.save();const bx=w/2-55,by=h*.23;ctx.fillStyle='rgba(6,20,34,.8)';ctx.fillRect(bx,by,110,18);ctx.fillStyle=d.driftSparks>70?'#65eeff':'#ffc96b';ctx.fillRect(bx+3,by+13,Math.min(104,d.driftSparks*1.04),3);ctx.textAlign='center';ctx.font='bold 10px Arial';ctx.fillText(d.driftSparks>70?'SOLTE: IMPULSO PRONTO':'CARREGANDO DRIFT',w/2,by+10);ctx.restore();}
            if (d.item) {
                ctx.font = "40px Arial"; ctx.textAlign = "center";
                let emoji = d.item === 'mushroom' ? '🍄' : (d.item === 'banana' ? '🍌' : '🐢');
                ctx.fillText(emoji, 55, 150);
            } else {
                ctx.fillStyle = "#aaa"; ctx.font = "bold 14px Arial"; ctx.textAlign = "center";
                ctx.fillText("—", 55, 140);
            }

            // ConsoleGames: leitura instantânea em telas pequenas. 
            // Apenas posição, volta e velocidade; sem círculos gigantes sobre a pista.
            if (w <= 700 || h <= 490 || window.ArcadeControls?.mode === "controls") {
                const label = String(d.finalRank) + "º  •  " + d.lap + "/" + CONF.TOTAL_LAPS + "  •  " + Math.floor(d.speed);
                ctx.save();
                ctx.textAlign = 'center';
                ctx.font = "bold " + Math.min(15,Math.max(11,w*0.032)) + "px Arial";
                ctx.fillStyle = "rgba(3,17,30,.70)";
                if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(w/2-93,52,186,25,11); ctx.fill(); }
                else ctx.fillRect(w/2-93,52,186,25);
                ctx.fillStyle = '#eafaff';
                ctx.fillText(label,w/2,69);
                ctx.restore();
            } else {
            const hudX = w - 80; const hudY = h - 60; 
            ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.beginPath(); ctx.arc(hudX, hudY, 55, 0, Math.PI * 2); ctx.fill();
            const rpm = Math.min(1, d.speed / CONF.TURBO_MAX_SPEED); 
            ctx.beginPath(); ctx.arc(hudX, hudY, 50, Math.PI, Math.PI + Math.PI * rpm); ctx.lineWidth = 6; ctx.strokeStyle = d.turboLock ? '#0ff' : '#f33'; ctx.stroke();
            ctx.fillStyle = '#fff'; ctx.font = "bold 36px 'Russo One'"; ctx.textAlign = 'center'; ctx.fillText(Math.floor(d.speed), hudX, hudY + 10);
            ctx.font = "bold 24px 'Russo One'"; ctx.fillStyle = '#ff0'; ctx.fillText(`${d.finalRank}º`, hudX, hudY - 35);
            ctx.fillStyle = '#fff'; ctx.font = "bold 14px 'Russo One'"; ctx.fillText(`VOLTA ${d.lap}/${CONF.TOTAL_LAPS}`, hudX, hudY - 20);

            }

            ctx.fillStyle = '#111'; ctx.fillRect(w/2 - 110, 20, 220, 20); ctx.fillStyle = d.turboLock ? '#0ff' : (d.nitro > 25 ? '#f90' : '#f33'); ctx.fillRect(w/2 - 108, 22, (216) * (d.nitro/100), 16);
            ctx.save();ctx.textAlign='center';ctx.font='bold 11px Arial';ctx.fillStyle='#fff';
            ctx.fillText('DIREÇÃO: '+(STEERING_ASSISTS[playOptions().steeringAssist]||STEERING_ASSISTS.light).label.toUpperCase(),w/2,49);
            if(window.ArcadeControls?.mode==='camera'&&d.item){ctx.fillStyle='#e5f7eb';ctx.textAlign='center';ctx.font='bold 12px Arial';const progress=d.cameraItemGesture?.progress||0;ctx.fillText(progress?'USANDO ITEM · '+Math.round(progress*100)+'%':d.cameraItemGesture?.consumed?'VOLTE A MÃO AO VOLANTE PARA USAR OUTRO ITEM':!d.cameraItemGesture?.armed?'MANTENHA AS DUAS MÃOS NO VOLANTE PARA PREPARAR':'ITEM: LEVE UMA MÃO À CABEÇA POR 0,35s',w/2,h<500?h*.79:h*.84,w-24);}
            if(d.trackingLost&&d.status==='RACING'){
                ctx.fillStyle='rgba(6,18,32,.88)';ctx.fillRect(w*.08,h*.40,w*.84,70);ctx.fillStyle='#fff';ctx.font='bold 15px Arial';
                ctx.fillText('CÂMERA SEM PILOTO',w/2,h*.40+25);ctx.font='12px Arial';ctx.fillText('Mostre as duas mãos para acelerar e dirigir.',w/2,h*.40+48,w*.8);
            }ctx.restore();

            // The steering zone is not a place for the wallet. Show balance only
            // in the non-touch legacy HUD, without touching Firebase money.
            if(w>700 && h>510 && window.ArcadeControls?.mode!=="controls"){
                const money=Number(window.Profile?.coins);
                const balance=Number.isFinite(money)&&money>=0&&money<1e9
                    ? new Intl.NumberFormat("pt-BR",{notation:"compact",maximumFractionDigits:1}).format(money)
                    : "consultar perfil";
                ctx.save();
                ctx.fillStyle="rgba(3,15,30,.63)";
                if(ctx.roundRect){ctx.beginPath();ctx.roundRect(20,h-77,158,43,16);ctx.fill()}
                else ctx.fillRect(20,h-77,158,43);
                ctx.textAlign="left";ctx.fillStyle="#f7d869";ctx.font="bold 15px Arial";
                ctx.fillText("SALDO: "+balance,32,h-50,142);
                ctx.restore();
            }

            if (minimapPath.length > 0) {
                const mapX = w <= 520 ? 10 : 25, mapY = w <= 520 ? 172 : 190, mapSize = w <= 520 ? 78 : 130; ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; ctx.fillRect(mapX, mapY, mapSize, mapSize); ctx.save(); ctx.translate(mapX + mapSize/2, mapY + mapSize/2);
                const scale = Math.min((mapSize-20)/minimapBounds.w, (mapSize-20)/minimapBounds.h); ctx.scale(scale, scale); ctx.translate(-(minimapBounds.minX+minimapBounds.maxX)/2, -(minimapBounds.minZ+minimapBounds.maxZ)/2);
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; ctx.beginPath(); minimapPath.forEach((p, i) => { if(i===0) ctx.moveTo(p.x, p.z); else ctx.lineTo(p.x, p.z); }); ctx.closePath(); ctx.stroke();
                const drawDot = (pos, c, r) => { const idx = Math.floor((pos/trackLength) * minimapPath.length) % minimapPath.length; const pt = minimapPath[idx]; if(pt){ ctx.fillStyle=c; ctx.beginPath(); ctx.arc(pt.x, pt.z, r, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle="#fff"; ctx.lineWidth=2; ctx.stroke(); } };
                d.rivals.forEach(r => drawDot(r.pos, r.status==='FINISHED' ? '#0f0' : (r.color||'#ffee00'), 22)); drawDot(d.pos, '#ff0000', 26); ctx.restore();
            }

            this.renderVirtualWheel(ctx);

            // --- INJEÇÃO DO CHAT GPT: PASSO 5 (TELA FINAL COM MATEMÁTICA RESPONSIVA E COPAS) ---
            if (this.raceState === "FINISHED") {
                const cx = w / 2;
                const cy = h / 2;
                const fTitle = Math.max(24, Math.min(48, w * 0.08));
                const fSub = Math.max(16, Math.min(28, w * 0.05));
                const fBtn = Math.max(14, Math.min(24, w * 0.04));
                const btnW = Math.max(250, Math.min(400, w * 0.8));
                const btnH = Math.max(45, Math.min(60, h * 0.1));

                ctx.fillStyle = "rgba(0,0,0,0.85)";
                ctx.fillRect(0, 0, w, h);

                ctx.fillStyle = "#00ffcc";
                ctx.font = `bold ${fTitle}px "Russo One", Arial`;
                ctx.textAlign = "center";
                ctx.fillText("CORRIDA FINALIZADA!", cx, cy - h*0.15);

                ctx.fillStyle = "#ffffff";
                ctx.font = `bold ${fSub}px Arial`;
                ctx.fillText(`POSIÇÃO FINAL: ${this.finalRank}º`, cx, cy - h*0.05);

                ctx.fillStyle = "#f1c40f";
                ctx.fillText(`RECOMPENSA: R$ ${this.reward}`, cx, cy + h*0.05);

                ctx.fillStyle = "#2ecc71";
                if(ctx.roundRect) {
                    ctx.beginPath(); ctx.roundRect(cx - btnW/2, cy + h*0.15, btnW, btnH, 10); ctx.fill();
                } else {
                    ctx.fillRect(cx - btnW/2, cy + h*0.15, btnW, btnH);
                }

                ctx.fillStyle = "#fff";
                ctx.font = `bold ${fBtn}px Arial`;
                
                let nextTrackId = this.selectedTrack + 1;
                let btnText = nextTrackId < TRACKS.length ? "PRÓXIMA CORRIDA" : "VER PÓDIO DA COPA";
                if (this.isOnline && !this.isHost && nextTrackId < TRACKS.length) btnText = "AGUARDANDO HOST...";

                ctx.fillText(btnText, cx, cy + h*0.15 + btnH/2 + fBtn*0.35);
                ctx.textAlign = "left";
            }
            // ------------------------------------
        },

        renderOnlineWait(ctx,w,h,title,description){
            ctx.save();ctx.fillStyle='rgba(5,18,29,.9)';ctx.fillRect(w*.05,h*.36,w*.9,h*.25);ctx.textAlign='center';ctx.fillStyle='#e9f5ee';ctx.font='bold '+Math.min(22,w*.05)+'px Arial';ctx.fillText(title,w/2,h*.45,w*.85);ctx.font='13px Arial';ctx.fillStyle='#bcdcd2';ctx.fillText(description,w/2,h*.51,w*.84);ctx.restore();
        },
        onlineContinueButton(ctx,w,h,label){
            const width=Math.min(360,w-28),height=Math.max(48,Math.min(60,h*.11)),y=h*.83;this.onlineActionHitbox={x:(w-width)/2,y,w:width,h:height};
            const ready=this.confirmedOnlineMatch===this.onlineCup.matchId+':'+this.onlineCup.state;ctx.fillStyle=ready?'#526d79':'#2b8373';ctx.fillRect((w-width)/2,y,width,height);ctx.fillStyle='#f2faf5';ctx.textAlign='center';ctx.font='bold '+Math.min(17,w*.042)+'px Arial';ctx.fillText(ready?'CONFIRMADO • AGUARDANDO OS OUTROS':label,w/2,y+height*.62,width-14);
        },
        renderOnlineStage(ctx,w,h){
            const cup=this.onlineCup;if(!cup)return;
            document.body?.classList?.remove('kart-racing');ctx.fillStyle='#102738';ctx.fillRect(0,0,w,h);ctx.textAlign='center';ctx.fillStyle='#b5e8ce';ctx.font='bold '+Math.min(26,w*.06)+'px Arial';ctx.fillText('ETAPA '+(cup.stage+1)+' / '+cup.tracks.length,w/2,h*.20,w-24);
            ctx.font='14px Arial';ctx.fillStyle='#deeeeb';ctx.fillText(TRACKS[cup.trackId].name,w/2,h*.25,w-24);
            const result=cup.results?.[cup.matchId];
            if(!result){ctx.font='bold 17px Arial';ctx.fillText('VOCÊ CRUZOU A LINHA',w/2,h*.39,w-24);ctx.font='13px Arial';ctx.fillStyle='#bdd9de';ctx.fillText('Aguardando os outros jogadores terminarem…',w/2,h*.47,w-24);return;}
            const rowHeight=Math.min(34,h*.065),start=h*.35;ctx.font='bold '+Math.min(16,w*.038)+'px Arial';
            result.ranking.forEach((r,i)=>{ctx.fillStyle=r.id===this.networkId?'#b2efca':'#dfebeb';const flag=r.status==='DNF'?'NÃO CONCLUIU':r.points+' PTS';ctx.fillText(r.rank+'º '+String(r.name).slice(0,16)+' · '+flag,w/2,start+i*rowHeight,w-22);});
            const missing=cup.humans.some(id=>!this.liveHumans().includes(id));ctx.fillStyle='#b9d9d2';ctx.font='12px Arial';ctx.fillText(missing?'Um participante desconectou. A próxima etapa aguarda.':'Cada jogador confirma para avançar com a mesma turma.',w/2,h*.75,w-24);
            this.onlineContinueButton(ctx,w,h,cup.stage+1<cup.tracks.length?'PRONTO PARA A PRÓXIMA ETAPA':'VER PÓDIO DA COPA');
        },
        renderOnlineCupEnd(ctx,w,h){
            const cup=this.onlineCup;document.body?.classList?.remove('kart-racing');ctx.fillStyle='#102738';ctx.fillRect(0,0,w,h);ctx.textAlign='center';ctx.fillStyle='#f0d080';ctx.font='bold '+Math.min(30,w*.065)+'px Arial';ctx.fillText('PÓDIO DA COPA',w/2,h*.20,w-24);ctx.font='14px Arial';ctx.fillStyle='#c5e6dd';ctx.fillText(this.currentFase.name||'MODO LIVRE',w/2,h*.26,w-24);
            const rows=cup?.standings||[];ctx.font='bold '+Math.min(18,w*.041)+'px Arial';rows.forEach((r,i)=>{ctx.fillStyle=r.id===this.networkId?'#b4f1ce':i===0?'#f0d080':'#e1efed';ctx.fillText((i+1)+'º '+String(r.name).slice(0,16)+' · '+r.points+' PTS',w/2,h*.36+i*Math.min(35,h*.063),w-24);});
            ctx.fillStyle='#c0dbd6';ctx.font='12px Arial';ctx.fillText('Pontos acumulados nas '+cup.tracks.length+' etapas.',w/2,h*.77,w-24);this.onlineContinueButton(ctx,w,h,'VOLTAR À SALA');
        },
        readCameraItemGesture(pose,videoH){
            const now=performance.now(),g=this.cameraItemGesture||(this.cameraItemGesture={armed:false,neutralSince:null,raisedSince:null,lastAt:null,lastFrame:null,progress:0,holding:false});
            const point=name=>pose?.keypoints?.find(k=>k.name===name&&k.score>=.25),nose=point('nose'),left=point('left_wrist'),right=point('right_wrist');
            const videoFrame=window.System?.video?.currentTime,frame=Number.isFinite(videoFrame)?videoFrame:now;
            const gap=g.lastAt===null?0:now-g.lastAt;
            const lost=!nose||!left||!right||gap>900;
            if(lost){g.armed=false;g.neutralSince=g.raisedSince=null;g.progress=0;g.holding=false;g.lastAt=now;return false;}
            if(frame===g.lastFrame)return false;g.lastFrame=frame;g.lastAt=now;
            const margin=videoH*.20,neutral=left.y>nose.y+margin&&right.y>nose.y+margin;
            if(neutral){g.holding=false;g.consumed=false;g.raisedSince=null;g.progress=0;if(g.neutralSince===null)g.neutralSince=now;if(now-g.neutralSince>=180&&this.itemCooldown<=0)g.armed=true;return false;}
            g.neutralSince=null;
            // Require a hand near the head in both axes, accepting either mirror label.
            const nearHead=hand=>Math.hypot((hand.x-nose.x)/(videoH*.25),(hand.y-nose.y+videoH*.035)/(videoH*.23))<=1;
            const raised=(nearHead(right)&&left.y>nose.y+margin)||(nearHead(left)&&right.y>nose.y+margin);
            if(!raised){g.raisedSince=null;g.progress=0;g.holding=false;g.armed=false;return false;}
            if(g.consumed){g.holding=true;return false;}
            if(!g.armed){g.holding=false;return false;}
            if(!this.item){g.steer=this.targetSteer;g.holding=true;g.consumed=true;g.armed=false;return false;}
            if(g.raisedSince===null){g.raisedSince=now;g.samples=0;g.steer=this.targetSteer;g.item=this.item;}
            g.holding=true;g.samples++;g.progress=Math.max(0,Math.min(1,(now-g.raisedSince)/350,g.samples/3));
            if(this.item!==g.item){g.armed=false;g.holding=false;g.progress=0;return false;}
            if(g.progress<1)return false;
            g.armed=false;g.progress=0;g.holding=true;g.consumed=true;g.raisedSince=null;return true;
        },

        renderCupEnd: function(ctx, w, h) {
            if(this.isOnline){this.renderOnlineCupEnd(ctx,w,h);return;}
            const cx = w / 2; const cy = h / 2;
            ctx.fillStyle = "rgba(20,0,0,0.95)"; ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = "#f1c40f"; ctx.textAlign = "center"; ctx.font = "bold " + Math.min(50,Math.max(21,w*.07)) + "px 'Russo One'";
            ctx.fillText("🏁 FIM DA COPA! 🏁", cx, h*0.15);
            
            let playersArr = [{ name: window.Profile?.username || 'VOCÊ', pts: this.cupPoints || 0 }];
            if (this.isOnline && this.remotePlayersData) {
                Object.keys(this.remotePlayersData).forEach(uid => {
                    if (uid !== this.networkId && !uid.startsWith('bot_')) {
                        playersArr.push({ name: this.remotePlayersData[uid].name, pts: this.remotePlayersData[uid].cupPoints || 0 });
                    }
                });
            }
            if (!this.isOnline || this.isHost) {
                this.localBots.forEach(bot => playersArr.push({name: bot.name, pts: Math.floor(Math.random()*25 + 5)}));
            }
            playersArr.sort((a,b) => b.pts - a.pts);

            ctx.font = "bold " + Math.min(28,Math.max(12,w*.043)) + "px Arial";
            playersArr.slice(0, 5).forEach((p, idx) => {
                let color = idx === 0 ? '#f1c40f' : (idx === 1 ? '#bdc3c7' : (idx === 2 ? '#cd7f32' : '#fff'));
                ctx.fillStyle = color;
                ctx.fillText(`${idx+1}º ${String(p.name).slice(0,14)} - ${p.pts} PTS`, cx, h*0.34 + (idx*Math.min(38,h*.07)));
            });

            const btnW = Math.max(250, Math.min(400, w * 0.8));
            const btnH = Math.max(45, Math.min(60, h * 0.1));
            const fBtn = Math.max(14, Math.min(24, w * 0.04));

            ctx.fillStyle = "#3498db"; 
            if(ctx.roundRect) {
                ctx.beginPath(); ctx.roundRect(cx - btnW/2, cy + h*0.30, btnW, btnH, 10); ctx.fill();
            } else {
                ctx.fillRect(cx - btnW/2, cy + h*0.30, btnW, btnH);
            }
            ctx.fillStyle = "#fff"; ctx.font = `bold ${fBtn}px 'Russo One'`;
            ctx.fillText("VOLTAR AO LOBBY", cx, cy + h*0.30 + btnH/2 + fBtn*0.35);
        },

        renderShop: function(ctx, w, h) {
            ctx.fillStyle = "#1e272e"; ctx.fillRect(0, 0, w, h);
            
            ctx.fillStyle = "#f1c40f"; ctx.textAlign = "center"; ctx.font = "bold " + Math.min(45,Math.max(26,w*.06)) + "px 'Russo One'";
            ctx.fillText("OFICINA DE KARTS", w/2, h * 0.1);

            let coins = window.Profile ? (window.Profile.coins || 0) : 0;
            ctx.fillStyle = "#2ecc71"; ctx.font = "bold " + Math.min(24,Math.max(18,w*.04)) + "px 'Chakra Petch'";
            const wallet=Number(coins);
            const readable=Number.isSafeInteger(wallet)&&wallet>=0&&wallet<1e9
              ? new Intl.NumberFormat("pt-BR",{notation:"compact",maximumFractionDigits:1}).format(wallet)
              : "CONFERIR SALDO";
            ctx.fillText("SALDO: "+readable,w/2,h*.16,Math.max(110,w-30));

            this.shopHitboxes = [];
            
            let tabW = Math.min(w * 0.28, 180); let tabH = 40;
            let tab1X = w/2 - tabW*1.5 - 10; let tab2X = w/2 - tabW/2; let tab3X = w/2 + tabW/2 + 10;
            
            const drawTab = (x, text, isActive, actionId) => {
                ctx.fillStyle = isActive ? "#3498db" : "#7f8c8d";
                if(ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, h*0.2, tabW, tabH, 10); ctx.fill(); } else { ctx.fillRect(x, h*0.2, tabW, tabH); }
                ctx.fillStyle = "#fff"; ctx.font = "bold 14px 'Russo One'"; ctx.fillText(text, x + tabW/2, h*0.2 + 25);
                this.shopHitboxes.push({ x: x, y: h*0.2, w: tabW, h: tabH, action: actionId });
            };

            drawTab(tab1X, "LOJA", this.shopTab === 'SHOP', 'tab_shop');
            drawTab(tab2X, "GARAGEM", this.shopTab === 'GARAGE', 'tab_garage');
            drawTab(tab3X, "PEÇAS", this.shopTab === 'PARTS', 'tab_parts');

            const cx = w/2; const cy = h*0.55;

            if (this.shopTab === 'SHOP' || this.shopTab === 'GARAGE') {
                let maxIdx = this.shopTab === 'SHOP' ? KART_MODELS.length - 1 : this.garage.length - 1;
                if (this.shopCarouselIdx > maxIdx) this.shopCarouselIdx = 0;
                
                let currentItem = this.shopTab === 'SHOP' ? KART_MODELS[this.shopCarouselIdx] : KART_MODELS[this.garage[this.shopCarouselIdx].modelId];

                let carW = Math.min(600, w * 0.9);
                ctx.fillStyle = "rgba(0,0,0,0.5)";
                if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(cx - carW/2, cy - 130, carW, 260, 20); ctx.fill(); } else { ctx.fillRect(cx - carW/2, cy - 130, carW, 260); }

                ctx.fillStyle = "#fff"; ctx.font = "bold 50px Arial";
                ctx.fillText("<", cx - carW/2 + 40, cy); 
                this.shopHitboxes.push({ x: cx - carW/2, y: cy - 60, w: 100, h: 120, action: 'prev' });
                ctx.fillText(">", cx + carW/2 - 40, cy); 
                this.shopHitboxes.push({ x: cx + carW/2 - 100, y: cy - 60, w: 100, h: 120, action: 'next' });

                let charColor = CHARACTERS[this.selectedChar].color;
                this.drawKartSprite(ctx, cx, cy - 20, w * 0.0035, 0, 0, 0, charColor, this.selectedChar, currentItem.id);

                ctx.fillStyle = "#fff"; ctx.font = "bold 26px 'Russo One'"; ctx.fillText(currentItem.name, cx, cy + 60);
                ctx.fillStyle = "#aaa"; ctx.font = "14px Arial"; ctx.fillText(currentItem.desc, cx, cy + 85);

                let btnW = 180; let btnH = 45; let btnY = cy + 105;
                
                if (this.shopTab === 'SHOP') {
                    if (currentItem.id === 0) {
                        ctx.fillStyle = "#2ecc71"; ctx.fillText("JÁ VEM DE FÁBRICA", cx, btnY + 25);
                    } else {
                        let canBuy = coins >= currentItem.price;
                        ctx.fillStyle = canBuy ? "#9b59b6" : "#7f8c8d";
                        if(ctx.roundRect) { ctx.beginPath(); ctx.roundRect(cx - btnW/2, btnY, btnW, btnH, 8); ctx.fill(); } else { ctx.fillRect(cx - btnW/2, btnY, btnW, btnH); }
                        ctx.fillStyle = "#fff"; ctx.font = "bold 18px 'Russo One'"; ctx.fillText(`COMPRAR R$${currentItem.price}`, cx, btnY + 28);
                        this.shopHitboxes.push({ x: cx - btnW/2, y: btnY, w: btnW, h: btnH, action: 'buy_kart', modelId: currentItem.id });
                    }
                } 
                else if (this.shopTab === 'GARAGE') {
                    let isEquipped = (this.activeKartIdx === this.shopCarouselIdx);
                    ctx.fillStyle = isEquipped ? "#27ae60" : "#34495e";
                    if(ctx.roundRect) { ctx.beginPath(); ctx.roundRect(cx - btnW - 5, btnY, btnW, btnH, 8); ctx.fill(); } else { ctx.fillRect(cx - btnW - 5, btnY, btnW, btnH); }
                    ctx.fillStyle = "#fff"; ctx.font = "bold 16px 'Russo One'"; ctx.fillText(isEquipped ? "EQUIPADO" : "EQUIPAR", cx - btnW/2 - 5, btnY + 28);
                    if (!isEquipped) this.shopHitboxes.push({ x: cx - btnW - 5, y: btnY, w: btnW, h: btnH, action: 'equip' });

                    if (this.garage.length > 1) {
                        ctx.fillStyle = "#e74c3c";
                        if(ctx.roundRect) { ctx.beginPath(); ctx.roundRect(cx + 5, btnY, btnW, btnH, 8); ctx.fill(); } else { ctx.fillRect(cx + 5, btnY, btnW, btnH); }
                        let refund = Math.floor(currentItem.price * 0.5);
                        ctx.fillStyle = "#fff"; ctx.fillText(`VENDER (+R$${refund})`, cx + btnW/2 + 5, btnY + 28);
                        this.shopHitboxes.push({ x: cx + 5, y: btnY, w: btnW, h: btnH, action: 'sell' });
                    }
                }
            }
            else if (this.shopTab === 'PARTS') {
                const upgradesList = [
                    { id: 'engine', name: '⚙️ MOTOR DE CORRIDA', desc: 'Aceleração e Velocidade Extra', levels: [0, 1500, 4000] },
                    { id: 'tires', name: '🛞 PNEUS ESPECIAIS', desc: 'Curvas / Menos Lento na Terra', levels: [0, 1200, 3000] },
                    { id: 'suspension', name: '🏎️ SUSPENSÃO PESADA', desc: 'Amortece saltos de explosões', levels: [0, 2000, 5000] }
                ];

                const rowH = Math.min(80, h * 0.15); const gap = Math.min(15, h * 0.02); 
                const boxW = Math.min(600, w * 0.9); const boxX = w/2 - boxW/2;
                const partStartY = h * 0.28;
                
                upgradesList.forEach((upg, i) => {
                    let currentLvl = this.kartUpgrades[upg.id] || 1;
                    let nextCost = upg.levels[currentLvl]; 
                    
                    let y = partStartY + i * (rowH + gap);
                    ctx.fillStyle = "rgba(0,0,0,0.5)"; 
                    if(ctx.roundRect) { ctx.beginPath(); ctx.roundRect(boxX, y, boxW, rowH, 10); ctx.fill(); } else { ctx.fillRect(boxX, y, boxW, rowH); }
                    
                    ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.font = "bold 18px 'Russo One'";
                    ctx.fillText(`${upg.name} (LVL ${currentLvl})`, boxX + 15, y + rowH * 0.4);
                    ctx.fillStyle = "#aaa"; ctx.font = "14px Arial"; ctx.fillText(upg.desc, boxX + 15, y + rowH * 0.7);

                    if (currentLvl < 3) {
                        let btnW = boxW * 0.28; let btnH = rowH * 0.7;
                        let btnX = boxX + boxW - btnW - 10; let btnY = y + rowH/2 - btnH/2;
                        let canBuy = coins >= nextCost;
                        
                        ctx.fillStyle = canBuy ? "#f39c12" : "#7f8c8d";
                        if(ctx.roundRect) { ctx.beginPath(); ctx.roundRect(btnX, btnY, btnW, btnH, 8); ctx.fill(); } else { ctx.fillRect(btnX, btnY, btnW, btnH); }
                        ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = "bold 16px 'Russo One'";
                        ctx.fillText(`R$ ${nextCost}`, btnX + btnW/2, btnY + btnH/2 + 5);
                        this.shopHitboxes.push({ x: btnX, y: btnY, w: btnW, h: btnH, action: 'buy_upgrade', type: upg.id, targetLvl: currentLvl + 1, cost: nextCost });
                    } else {
                        ctx.fillStyle = "#2ecc71"; ctx.textAlign = "right"; ctx.font = "bold 18px 'Russo One'"; ctx.fillText("MÁXIMO", boxX + boxW - 15, y + rowH/2 + 6);
                    }
                });
            }

            let backW = 200; let backH = 45;
            let backX = w/2 - backW/2; let backY = h * 0.88;
            ctx.fillStyle = "#c0392b"; 
            if(ctx.roundRect) { ctx.beginPath(); ctx.roundRect(backX, backY, backW, backH, 20); ctx.fill(); } else { ctx.fillRect(backX, backY, backW, backH); }
            ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = "bold 16px 'Russo One'";
            ctx.fillText("VOLTAR AO LOBBY", w/2, backY + 28);
            this.shopHitboxes.push({ x: backX, y: backY, w: backW, h: backH, action: 'back' });
        },

        renderModeSelect: function(ctx, w, h) {
            ctx.fillStyle = "#2c3e50"; ctx.fillRect(0, 0, w, h); ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.font = "bold 40px 'Russo One'"; ctx.fillText("KART LEGENDS", w/2, h * 0.27,w-24);ctx.font='bold 17px Arial';ctx.fillStyle='#d5e9e5';ctx.fillText(this.currentFase.name||'MODO LIVRE',w/2,h*.35,w-24);
            ctx.fillStyle = "#e67e22"; ctx.fillRect(w/2 - 160, h * 0.45, 320, 65); ctx.fillStyle = "#27ae60"; ctx.fillRect(w/2 - 160, h * 0.6, 320, 65);
            ctx.fillStyle = "white"; ctx.font = "bold 20px 'Russo One'"; ctx.fillText("JOGAR SOLO", w/2, h * 0.45 + 40); ctx.fillText("JOGAR ONLINE", w/2, h * 0.6 + 40);
        },

        renderLobby: function(ctx, w, h) {
            ctx.fillStyle = "#2c3e50"; ctx.fillRect(0, 0, w, h); const char = CHARACTERS[this.selectedChar];
            this.lobbyHitboxes = []; 

            ctx.fillStyle = char.color; ctx.beginPath(); ctx.arc(w/2, h*0.2, 45, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.font = "bold 28px 'Russo One'"; ctx.fillText(char.name, w/2, h*0.2 + 70);
            this.lobbyHitboxes.push({ x: w/2 - 60, y: h*0.2 - 50, w: 120, h: 130, action: 'change_char' });
            
            ctx.fillStyle = "#f1c40f"; ctx.font = "20px 'Russo One'"; 
            if (this.currentFase.mode === 'COIN_HUNT') ctx.fillText(`MISSÃO: COLETE ${this.currentFase.targetCoins} MOEDAS`, w/2, h*0.35);
            else ctx.fillText(`MISSÃO: CHEGUE NO TOP ${this.currentFase.targetRank}`, w/2, h*0.35);
            
            let displayTrack=this.selectedTrack;
            ctx.fillStyle = "#fff"; ctx.font = "16px 'Russo One'"; ctx.fillText("PISTA: " + TRACKS[displayTrack].name, w/2, h*0.42);
            if (this.currentFase.id === 'arcade') {
                ctx.fillStyle = "#aaa"; ctx.font = "12px Arial"; ctx.fillText("(Clique nesta área para mudar a pista)", w/2, h*0.45);
                this.lobbyHitboxes.push({ x: w/2 - 150, y: h*0.38, w: 300, h: 80, action: 'change_track' });
            }

            let btnWidth = Math.min(320, w * 0.85);
            
            let btnKartY = h*0.52;
            ctx.fillStyle = this.useCustomKart ? "#2ecc71" : "#7f8c8d";
            if(ctx.roundRect) { ctx.beginPath(); ctx.roundRect(w/2 - btnWidth/2, btnKartY, btnWidth, 45, 15); ctx.fill(); }
            else { ctx.fillRect(w/2 - btnWidth/2, btnKartY, btnWidth, 45); }
            ctx.fillStyle = "#fff"; ctx.font = "bold 15px 'Russo One'";
            let currentKartName = this.garage[this.activeKartIdx] ? KART_MODELS[this.garage[this.activeKartIdx].modelId].name : "PADRÃO";
            ctx.fillText(this.useCustomKart ? `USANDO: ${currentKartName}` : "KART: PADRÃO DO PERSONAGEM", w/2, btnKartY + 28);
            this.lobbyHitboxes.push({ x: w/2 - btnWidth/2, y: btnKartY, w: btnWidth, h: 45, action: 'toggle_kart' });

            let btnShopY = h*0.62;
            ctx.fillStyle = "#8e44ad";
            if(ctx.roundRect) { ctx.beginPath(); ctx.roundRect(w/2 - btnWidth/2, btnShopY, btnWidth, 50, 15); ctx.fill(); }
            else { ctx.fillRect(w/2 - btnWidth/2, btnShopY, btnWidth, 50); }
            ctx.fillStyle = "#fff"; ctx.font = "bold 18px 'Russo One'";
            ctx.fillText("⚙️ OFICINA DE KARTS", w/2, btnShopY + 32);
            this.lobbyHitboxes.push({ x: w/2 - btnWidth/2, y: btnShopY, w: btnWidth, h: 50, action: 'open_shop' });

            if (resetBtn) resetBtn.style.display = (this.isOnline && this.isHost) ? 'flex' : 'none';

            if (this.isOnline) {
                const pids = this.liveHumans(); let startY = h * 0.75; ctx.font = "12px Arial"; ctx.fillStyle = "#ccc"; ctx.fillText("JOGADORES NA SALA:", w/2, startY - 15);
                pids.forEach((pid, i) => {
                    const p = this.remotePlayersData[pid]; 
                    if (this.networkNow() - (p.lastSeen || 0) > 30000) return;
                    const isMe = pid === this.networkId; const color = CHARACTERS[p.charId || 0].color;
                    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(w/2 - 100, startY + (i*20), 6, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = isMe ? "#fff" : "#aaa"; ctx.textAlign = "left"; ctx.fillText(`${CHARACTERS[p.charId||0].name} ${isMe ? '(VOCÊ)' : ''}`, w/2 - 80, startY + (i*20) + 4);
                    if (pid === this.roomHostId) { ctx.fillStyle = "#f1c40f"; ctx.fillText("👑 HOST", w/2 + 50, startY + (i*20) + 4); } else if (p.ready) { ctx.fillStyle = "#2ecc71"; ctx.fillText("✔ PRONTO", w/2 + 50, startY + (i*20) + 4); }
                }); ctx.textAlign = "center";
            }

            if(this.isOnline){ctx.font='12px Arial';ctx.fillStyle='#b8dfd0';ctx.fillText(this.waitingForNextCup?'COPA EM ANDAMENTO • AGUARDE A PRÓXIMA':(this.currentFase.name||'MODO LIVRE')+' • SALA ONLINE',w/2,h*.13,w-24);}
            if (this.isOnline && this.isHost) {
                const canStart = this.liveHumans().length >= 2;
                ctx.fillStyle = canStart ? "#c0392b" : "#7f8c8d"; ctx.fillRect(w/2 - 160, h*0.85, 320, 60); ctx.fillStyle = "white"; ctx.font = "bold 22px 'Russo One'"; ctx.fillText(canStart ? "INICIAR CORRIDA" : "AGUARDANDO PLAYERS...", w/2, h*0.85 + 38);
            } else {
                ctx.fillStyle = this.isReady ? "#e67e22" : "#27ae60"; ctx.fillRect(w/2 - 160, h*0.85, 320, 60); ctx.fillStyle = "white"; ctx.font = "bold 22px 'Russo One'"; ctx.fillText(this.isReady ? "AGUARDANDO HOST..." : "PRONTO!", w/2, h*0.85 + 38);
            }
        }
    };

    if(window.System) {
        window.System.registerGame('drive', 'Kart Legends', '🏎️', Logic, { 
            camOpacity: 0.1,
            phases: [
                { id: 'f1', name: 'COPA COGUMELO', desc: 'Chegue no Pódio (Top 3).', mode: 'RACE', targetRank: 3, trackId: 0, diff: 'EASY', reqLvl: 1 },
                { id: 'f2', name: 'CAÇA ÀS MOEDAS', desc: 'Colete 20 moedas na areia.', mode: 'COIN_HUNT', targetCoins: 20, trackId: 1, diff: 'EASY', reqLvl: 2 },
                { id: 'f3', name: 'GRANDE PRÊMIO', desc: 'Vença a IA Implacável em 1º.', mode: 'RACE', targetRank: 1, trackId: 2, diff: 'HARD', reqLvl: 3 },
                { id: 'arcade', name: 'MODO LIVRE', desc: 'Jogue online ou offline sem regras.', mode: 'RACE', targetRank: 1, trackId: 0, diff: 'MEDIUM', reqLvl: 1 }
            ]
        });
    }

})();
