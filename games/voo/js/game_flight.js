// =============================================================================
// AERO STRIKE WAR: TACTICAL YOKE SIMULATOR (AAA PROFESSIONAL EVOLUTION)
// ARQUITETO: SENIOR GAME ENGINE ARCHITECT
// STATUS: 100% COMPLETO. FÍSICA CORRIGIDA, MULTIPLAYER SYNC, YOKE BALANCEADO (0.09).
// =============================================================================

(function() {
    "use strict";

    // -----------------------------------------------------------------
    // 1. CONFIGURAÇÕES FÍSICAS E METADADOS AAA
    // -----------------------------------------------------------------
    const GAME_CONFIG = {
        GRAVITY: 9.80665,     
        R_GAS: 287.05,        
        GAMMA: 1.4,           
        MAX_ALTITUDE: 50000   
    };

    const BASE_PLANE_STATS = {
        thrust: 400000,
        mass: 12000, 
        wingArea: 40.0,
        cd0: 0.02, 
        kInduced: 0.04, 
        clMax: 4.5,
        stallAngle: 1.2,
        maxPitchRate: 3.0, 
        maxRollRate: 4.5,
        overheatThreshold: 100
    };

    function createParticle(x, y, z, c, size, life, type) {
        return {
            x: x, y: y, z: z,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            vz: (Math.random() - 0.5) * 200,
            life: life, maxLife: life, c: c, size: size, type: type
        };
    }

    // -----------------------------------------------------------------
    // 2. MOTOR DE RENDERIZAÇÃO 3D VETORIAL (TRUE 3D PROJECTION CORRECTED)
    // -----------------------------------------------------------------
    const Engine3D = {
        fov: 800,
        project: function(objX, objY, objZ, camX, camY, camZ, pitch, yaw, roll, w, h) {
            let dx = objX - camX, dy = objY - camY, dz = objZ - camZ;
            
            let cy = Math.cos(yaw), sy = Math.sin(yaw);
            let x1 = dx * cy - dz * sy;
            let z1 = dx * sy + dz * cy;
            
            let cp = Math.cos(pitch), sp = Math.sin(pitch);
            let y2 = dy * cp - z1 * sp;
            let z2 = dy * sp + z1 * cp;
            
            if (z2 < 10) return { visible: false };
            
            let cr = Math.cos(roll), sr = Math.sin(roll);
            let finalX = x1 * cr - y2 * sr;
            let finalY = x1 * sr + y2 * cr;
            
            let scale = Engine3D.fov / z2;
            return { 
                x: (w/2) + (finalX * scale), 
                y: (h/2) - (finalY * scale), 
                s: scale, 
                z: z2, 
                visible: true 
            };
        },
        
        drawJetModel: function(ctx, px, py, scale, roll, isEnemy, color) {
            ctx.save(); 
            ctx.translate(px, py); 
            ctx.rotate(roll); 
            ctx.scale(scale, scale);
            
            let jetGrad = ctx.createLinearGradient(0, -30, 0, 30);
            if (isEnemy) {
                jetGrad.addColorStop(0, "#441111"); jetGrad.addColorStop(0.5, "#cc2222"); jetGrad.addColorStop(1, "#220000");
                ctx.strokeStyle = "#ff5555";
            } else {
                jetGrad.addColorStop(0, "#113333"); jetGrad.addColorStop(0.5, "#2288aa"); jetGrad.addColorStop(1, "#001111");
                ctx.strokeStyle = color || "#00ffcc";
            }

            ctx.lineWidth = 2; ctx.fillStyle = jetGrad;
            
            ctx.beginPath();
            ctx.moveTo(0, -40); ctx.lineTo(6, -15); ctx.lineTo(35, 10); ctx.lineTo(10, 15); ctx.lineTo(15, 30); 
            ctx.lineTo(0, 25); ctx.lineTo(-15, 30); ctx.lineTo(-10, 15); ctx.lineTo(-35, 10); ctx.lineTo(-6, -15); 
            ctx.closePath();
            
            ctx.shadowBlur = 10; ctx.shadowColor = isEnemy ? "#ff0000" : "#00ffff";
            ctx.fill(); ctx.stroke();
            
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.beginPath(); ctx.moveTo(0,-25); ctx.lineTo(3,-10); ctx.lineTo(-3,-10); ctx.fill();

            ctx.shadowBlur = 20; ctx.shadowColor = "#ff9900";
            ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(0, 28, Math.random() * 5 + 4, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#ff6600"; ctx.beginPath(); ctx.arc(0, 28, Math.random() * 8 + 6, 0, Math.PI*2); ctx.fill();

            ctx.restore();
        }
    };

    const GameSfx = {
        ctx: null, engineSrc: null, ready: false,
        init: function() {
            if (this.ready) return;
            try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); this.ready = true; } catch(e) {}
        },
        startEngine: function() {
            if (!this.ready || this.engineSrc || !this.ctx) return;
            if (this.ctx.state === 'suspended') this.ctx.resume();
            const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < buf.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
            this.engineSrc = this.ctx.createBufferSource();
            this.engineSrc.buffer = buf; this.engineSrc.loop = true;
            const filter = this.ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 400;
            const gain = this.ctx.createGain(); gain.gain.value = 0.15;this.engineGain=gain;this.engineFilter=filter;
            this.engineSrc.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
            this.engineSrc.start();
        },
        play: function(type) {
            // Preserva os sons base caso exista uma biblioteca externa Sfx (como 'lock' e 'buy')
            if (window.Sfx && window.Sfx.play) {
                if (type === 'lock') window.Sfx.play(1000, 'square', 0.1, 0.1);
                else if (type === 'buy') window.Sfx.play(1200, 'sine', 0.1, 0.1);
            }
            
            // Novos sons nativos focados em imersão (sem depender do window.Sfx)
            if (!this.ctx) return;
            const t = this.ctx.currentTime;
            const volume=window.ArcadePlaySettings?.get()[type==='lock'||type==='hit'?'alertVolume':'effectsVolume']??1;
            
            if(type==='lock'){
                const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.setValueAtTime(880,t);o.frequency.setValueAtTime(1175,t+.07);g.gain.setValueAtTime(Math.max(.00001,.09*volume),t);g.gain.exponentialRampToValueAtTime(.00001,t+.16);o.connect(g);g.connect(this.ctx.destination);o.onended=()=>{o.disconnect();g.disconnect();};o.start(t);o.stop(t+.17);
            }
            else if (type === 'missile') { // 2: Som realista de míssil (propulsão/whoosh)
                const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
                const data = buf.getChannelData(0);
                for (let i = 0; i < buf.length; i++) data[i] = (Math.random() * 2 - 1);
                const noise = this.ctx.createBufferSource(); noise.buffer = buf;
                const filter = this.ctx.createBiquadFilter(); filter.type = 'bandpass';
                filter.frequency.setValueAtTime(800, t); filter.frequency.linearRampToValueAtTime(200, t + 1.5);
                const g = this.ctx.createGain(); g.gain.setValueAtTime(Math.max(.00001,.8*volume), t); g.gain.exponentialRampToValueAtTime(0.01, t + 1.5);
                noise.connect(filter); filter.connect(g); g.connect(this.ctx.destination);
                noise.start(t); noise.stop(t + 1.5);
            } 
            else if (type === 'vulcan') { // 3: Som da metralhadora
                const o = this.ctx.createOscillator(), g = this.ctx.createGain();
                o.type = 'sawtooth'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.1);
                g.gain.setValueAtTime(Math.max(.00001,.3*volume), t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
                o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t + 0.1);
            }
            else if (type === 'boom') { // 4: Som de explosão das aeronaves
                const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
                const data = buf.getChannelData(0);
                for (let i = 0; i < buf.length; i++) data[i] = (Math.random() * 2 - 1);
                const noise = this.ctx.createBufferSource(); noise.buffer = buf;
                const filter = this.ctx.createBiquadFilter(); filter.type = 'lowpass'; 
                filter.frequency.setValueAtTime(1000, t); filter.frequency.exponentialRampToValueAtTime(50, t + 1.5);
                const g = this.ctx.createGain(); g.gain.setValueAtTime(Math.max(.00001,volume), t); g.gain.exponentialRampToValueAtTime(0.01, t + 1.5);
                noise.connect(filter); filter.connect(g); g.connect(this.ctx.destination);
                noise.start(t); noise.stop(t + 1.5);
            }
            else if (type === 'hit') { // 5: Som de impacto na nave do jogador
                const o = this.ctx.createOscillator(), g = this.ctx.createGain();
                o.type = 'square'; o.frequency.setValueAtTime(100, t); o.frequency.exponentialRampToValueAtTime(20, t + 0.3);
                g.gain.setValueAtTime(Math.max(.00001,.8*volume), t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
                o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t + 0.3);
            }
        },
        stop: function() { if (this.engineSrc) { try { this.engineSrc.stop(); } catch(e){} this.engineSrc = null; } }
    };

    // -----------------------------------------------------------------
    // 3. ESTRUTURA PRINCIPAL
    // -----------------------------------------------------------------
    const Game = {
        state: 'INIT', lastTime: 0, mode: 'SINGLE',
        session: { kills: 0, cash: 0, goal: 15, wave: 1, xp: 0 },
        upgrades: { engine: 1, missiles: 1, armor: 1 },
        airframe:'falcon',
        airframes:[{id:'falcon',name:'Falcão · equilibrado'},{id:'interceptor',name:'Interceptor · motor nível 3',requires:'engine'},{id:'sentinel',name:'Sentinela · blindagem nível 3',requires:'armor'}],
        currentStats: null,
        ship: { 
            hp: 100, maxHp: 100, speed: 250, x: 0, y: 3000, z: 0, vx: 0, vy: 0, vz: 250, 
            pitch: 0, yaw: 0, roll: 0, gForce: 1, mach: 0, alpha: 0, isStalling: false, 
            inputs: {pitch:0, roll:0}, afterburner: false,
            engineHealth: 100, wingHealth: 100, structuralIntegrity: 100, engineHeat: 0 
        },
        pilot: { active: false, baseY: 0, targetRoll: 0, targetPitch: 0, headTilt: false, throttle: 1.0 },
        timer: 5.0, keys: {}, keysBound: false, touchBound: false,
        entities: [], bullets: [], missiles: [], clouds: [], scenery: [], fx: [], floaters: [],
        combat: { target: null, locked: false, lockTimer: 0, vulcanCd: 0, missileCd: 0 },
        net: { isHost: false, uid: null, players: {}, sessionRef: null, playersRef: null, sharedRef: null, loop: null, sharedData: { wave: 1, teamKills: 0 }, lastSend: 0 },

        init: function(faseData) {
            this._cleanupNet();
            
            this.lastTime = performance.now();
            this.session = { kills: 0, cash:Number(window.Profile?.coins)||0, goal: 15, wave: 1, xp:Number(window.Profile?.xp)||0 };
            this.upgrades = { engine: 1, missiles: 1, armor: 1 };
            this.state='INIT';
            this.careerKey='thia:flight-career:v1:'+(window.System?.playerId||'local');
            let saved={};try{saved=JSON.parse(localStorage.getItem(this.careerKey)||'{}')||{};}catch{}
            if(window.Profile?.flightSave&&typeof window.Profile.flightSave==='object')saved=window.Profile.flightSave;
            for(const key of Object.keys(this.upgrades))this.upgrades[key]=Math.max(1,Math.min(5,Math.floor(Number(saved.upgrades?.[key])||1)));
            this.flightCareer={kills:Math.max(0,Number(saved.kills)||0),school:!!saved.school};
            this.airframe='falcon';this.selectAirframe(saved.airframe||'falcon');
            this.currentStats = JSON.parse(JSON.stringify(BASE_PLANE_STATS));
            
            this.ship = { 
                hp: 100, maxHp: 100, speed: 250, x: 0, y: 3000, z: 0, vx: 0, vy: 0, vz: 250, 
                pitch: 0, yaw: 0, roll: 0, gForce: 1, mach: 0, alpha: 0, isStalling: false, 
                inputs: {pitch:0, roll:0}, afterburner: false,
                engineHealth: 100, wingHealth: 100, structuralIntegrity: 100, engineHeat: 0 
            };
            this.pilot = { active: false, baseY: 0, targetRoll: 0, targetPitch: 0, headTilt: false, throttle: 1.0 };
            this.manualFireHeld=false;this.manualStick={x:0,y:0,active:false};this.entities = []; this.bullets = []; this.missiles = []; this.clouds = []; this.scenery = []; this.fx = []; this.floaters = [];
            this.combat = { target: null, locked: false, lockTimer: 0, vulcanCd: 0, missileCd: 0 };
            
            for (let i = 0; i < 50; i++) {
                this.clouds.push({ x: (Math.random()-0.5)*120000, y: 4000+Math.random()*15000, z: (Math.random()-0.5)*120000, size: 3000+Math.random()*6000 });
            }

            for (let j = 0; j < 300; j++) {
                this.scenery.push({
                    x: (Math.random() - 0.5) * 100000,
                    z: (Math.random() - 0.5) * 100000,
                    w: 200 + Math.random() * 500,
                    h:60+Math.random()*180,kind:j%4===0?'village':'forest',
                    color: `rgba(${30 + Math.random() * 30}, ${40 + Math.random() * 40}, ${30 + Math.random() * 30}, 1)` 
                });
            }
            
            let baseUid = (window.System && window.System.playerId) ? window.System.playerId : "anon";
            let sessionSuffix = Math.floor(Math.random() * 100000);
            this.net.uid = baseUid + "_" + sessionSuffix;

            this.mode = (faseData && faseData.mode) ? faseData.mode : 'SINGLE';
            this.flightSchool=faseData?.school?{stage:'takeoff',gate:0,complete:false,lastMessage:''}:null;
            
            if (!this.keysBound) {
                window.addEventListener('keydown', (e) => this.keys[e.key] = true);
                window.addEventListener('keyup', (e) => this.keys[e.key] = false);
                this.keysBound = true;
            }
            
            if (!this.touchBound) {
                let self = this;
                let handleTap = function(e) {
                    try {
                        // Do not let an overlay button trigger a second native
                        // interaction. Canvas is the only flight touch surface.
                        const target=e.target;
                        if(!target || !target.closest || !target.closest('#game-canvas'))return;
                        if(e.type==='touchstart' && typeof PointerEvent!=='undefined')return;
                        let cvs = window.System && window.System.canvas ? window.System.canvas : document.getElementById('game-canvas');
                        let rect = cvs ? cvs.getBoundingClientRect() : {left:0, top:0, width: window.innerWidth, height: window.innerHeight};
                        let cx = e.clientX; let cy = e.clientY;
                        if (e.touches && e.touches.length > 0) { cx = e.touches[0].clientX; cy = e.touches[0].clientY; }
                        
                        let touchX = ((cx - rect.left) / rect.width) * window.innerWidth;
                        let touchY = ((cy - rect.top) / rect.height) * window.innerHeight;
                        let sc = Math.min(1, window.innerWidth / 600); 

                        if ((self.state === 'LOBBY' || self.state === 'HANGAR') && touchX > 20*sc && touchX < 120*sc && touchY > 20*sc && touchY < 60*sc) {
                            self.cleanup();
                            if(window.System && window.System.home) window.System.home();
                            return;
                        }

                        if (self.state === 'LOBBY' && (self.mode === 'PVP' || self.mode === 'COOP') && touchX > window.innerWidth - 180*sc && touchY > 20*sc && touchY < 60*sc) {
                            if (self.net.sessionRef) {
                                self.net.sessionRef.child('host').set(self.net.uid);
                                self.net.sessionRef.child('state').set('LOBBY'); 
                                self.net.isHost = true;
                                if(window.System && window.System.msg) window.System.msg("VOCÊ ASSUMIU O CONTROLE!", "#00ffcc");
                            }
                            return;
                        }

                        if (self.state === 'LOBBY') {
                            if (self.mode === 'SINGLE' || self.mode === 'FREE') {
                                self.state = 'HANGAR';
                            } else if (self.net.isHost) {
                                if (self.net.sessionRef) self.net.sessionRef.child('state').set('HANGAR');
                                else self.state = 'HANGAR';
                            } else if (!self.net.isHost && self.net.uid && self.net.playersRef) {
                                self.net.playersRef.child(self.net.uid).update({ready: true});
                            }
                        } else if (self.state === 'HANGAR') {
                            self._processHangarClick(touchX, touchY, window.innerWidth, window.innerHeight);
                        } else if (self.state === 'CALIBRATION') {
                            // Calibration only completes via the explicit CONTINUAR
                            // control or by holding a valid camera pose for 5 seconds.
                            // Touching the canvas must never force timer to zero.
                        } else if (self.state === 'PLAYING') {
                            self.pilot.headTilt = true;
                            setTimeout(() => { self.pilot.headTilt = false; }, 250);
                        }
                    } catch(err) { console.error("Touch Error:", err); }
                };
                window.addEventListener('pointerdown', handleTap);
                window.addEventListener('touchstart', handleTap);
                this.touchBound = true;
            }

            if ((this.mode === 'PVP' || this.mode === 'COOP') && window.DB) {
                this._initNet();
            } else {
                this.state = 'HANGAR'; 
                this.net.isHost = true; 
            }
            GameSfx.init();
        },

        _initNet: function() {
            this.state = 'LOBBY'; this.net.players = {};
            this.net.sessionRef = window.DB.ref('sessions/flight_' + this.mode);
            this.net.playersRef = this.net.sessionRef.child('players');
            this.net.sharedRef = this.net.sessionRef.child('shared');
            
            this.net.playersRef.child(this.net.uid).onDisconnect().remove();
            
            let self = this;
            let uname = (window.Profile && window.Profile.username) ? window.Profile.username : 'PILOTO';
            
            self.net.playersRef.child(self.net.uid).set({
                name: uname, ready: false, hp: 100, x: 0, y: 3000, z: 0, pitch: 0, yaw: 0, roll: 0, timestamp: Date.now(), firing: false, missilesFired: 0
            });

            this.net.playersRef.on('value', snap => { 
                self.net.players = snap.val() || {}; 
                
                if (self.state === 'PLAYING' && self.net.players[self.net.uid]) {
                    let remoteHp = self.net.players[self.net.uid].hp;
                    if (remoteHp !== undefined && remoteHp < self.ship.hp) {
                        self.ship.hp = remoteHp;
                        if (window.Gfx && window.Gfx.shakeScreen) window.Gfx.shakeScreen(15);
                        
                        // 5: Emoção ao ser atingido (Vibração e Som de Impacto no Multiplayer)
                        if (navigator.vibrate) navigator.vibrate([200, 50, 200]);
                        GameSfx.play('hit');
                    }
                }

                this.net.sessionRef.child('host').once('value').then(hSnap => {
                    let currentHost = hSnap.val();
                    let connectedUIDs = Object.keys(self.net.players);
                    
                    if (!currentHost || !self.net.players[currentHost]) {
                        if (connectedUIDs.length > 0) {
                            let newHost = connectedUIDs[0];
                            if (newHost === self.net.uid) {
                                self.net.isHost = true;
                                self.net.sessionRef.child('host').set(self.net.uid);
                                
                                if (connectedUIDs.length === 1) {
                                    self.net.sessionRef.child('state').set('LOBBY');
                                    self.net.sharedRef.set({ wave: 1, teamKills: 0 });
                                }
                            } else {
                                self.net.isHost = false;
                            }
                        }
                    } else {
                        self.net.isHost = (currentHost === self.net.uid);
                    }
                });
            });

            this.net.sharedRef.on('value', snap => { self.net.sharedData = snap.val() || { wave: 1, teamKills: 0 }; });
            
            this.net.sessionRef.child('state').on('value', snap => {
                if (snap.val() === 'HANGAR' && self.state === 'LOBBY') self.state = 'HANGAR';
                if (snap.val() === 'PLAYING' && self.state === 'HANGAR') { self.state = 'CALIBRATION'; self.timer = 5.0; }
            });
        },

        _cleanupNet: function() {
            if (this.net.loop) { clearInterval(this.net.loop); this.net.loop = null; }
            if (this.net.playersRef && this.net.uid) {
                this.net.playersRef.child(this.net.uid).remove();
                this.net.playersRef.off();
            }
            if (this.net.sharedRef) this.net.sharedRef.off();
            if (this.net.sessionRef) this.net.sessionRef.child('state').off();
            
            this.net.isHost = false;
            this.net.players = {};
            this.net.sessionRef = null;
            this.net.playersRef = null;
            this.net.sharedRef = null;
        },

        cleanup: function() {
            GameSfx.stop();
            this._cleanupNet();
            this.state = 'INIT';
        },

        _getRank: function() {
            let ranks = ["RECRUTA", "PILOTO", "VETERANO", "SARGENTO", "TENENTE", "CAPITÃO", "MAJOR", "CORONEL", "COMANDANTE", "ACE", "LENDÁRIO"];
            let idx = Math.min(10, Math.floor(Math.sqrt(this.session.xp / 500)));
            return ranks[idx];
        },

        _saveCareer: function(){
            const record={...this.flightCareer,upgrades:{...this.upgrades},airframe:this.airframe};
            try{localStorage.setItem(this.careerKey,JSON.stringify(record));}catch{}
            if(window.Profile)window.Profile.flightSave=record;
            if(this.state!=='INIT'&&window.DB&&window.System?.playerId)window.DB.ref('users/'+window.System.playerId+'/flightSave').set(record);
        },
        selectAirframe: function(id){
            const model=this.airframes.find(m=>m.id===id);
            if(!model||(model.requires&&this.upgrades[model.requires]<3))return false;
            if(this.state==='PLAYING'||this.state==='CALIBRATION')return false;
            this.airframe=id;this._saveCareer();return true;
        },

        _processHangarClick: function(x, y, w, h) {
            let buy = (cost, type) => {
                if (this.upgrades[type]<5 && this.session.cash >= cost) {
                    this.session.cash -= cost;
                    this.upgrades[type]++;
                    if(window.Profile)window.Profile.coins=this.session.cash;
                    this._saveCareer();
                    GameSfx.play('buy');
                    let realId = window.System && window.System.playerId;
                    if (window.DB && realId) {
                        window.DB.ref('users/' + realId + '/coins').set(this.session.cash);
                    }
                } else GameSfx.play('vulcan');
            };

            let sc = Math.min(1, w / 600);
            if(Math.abs(x-w/2)>150*sc)return;
            if (y > h*0.3 && y < h*0.45) buy(500 * this.upgrades.engine, 'engine');
            else if (y > h*0.48 && y < h*0.63) buy(800 * this.upgrades.missiles, 'missiles');
            else if (y > h*0.66 && y < h*0.81) buy(1000 * this.upgrades.armor, 'armor');
            else if (y > h*0.85) {
                if ((this.mode === 'PVP' || this.mode === 'COOP') && this.net.isHost && this.net.sessionRef) {
                    this.net.sessionRef.child('state').set('PLAYING');
                    if (this.net.sharedRef) this.net.sharedRef.set({ wave: 1, teamKills: 0 }); 
                } else if (this.mode === 'SINGLE' || this.mode === 'FREE') { 
                    this.state = 'CALIBRATION'; this.timer = 5.0; 
                }
            }
        },

        _startMission: function() {
            this.currentStats=JSON.parse(JSON.stringify(BASE_PLANE_STATS));
            this.currentStats.thrust+=((this.upgrades.engine-1)*50000);
            this.ship.maxHp=100+(this.upgrades.armor-1)*100;
            if(this.airframe==='interceptor'){this.currentStats.thrust*=1.12;this.currentStats.mass*=.95;this.currentStats.maxRollRate*=1.15;}
            if(this.airframe==='sentinel'){this.ship.maxHp*=1.25;this.currentStats.mass*=1.15;this.currentStats.maxRollRate*=.85;}
            this.ship.hp=this.ship.maxHp;
            this.state = 'PLAYING';
            if(this.flightSchool){Object.assign(this.ship,{x:0,y:8,z:-2200,vx:0,vy:0,vz:0,speed:0,yaw:0,pitch:0,roll:0});this.manualThrottle=.7;this.pilot.throttle=.7;this.flightSchool.stage='takeoff';this.flightSchool.gate=0;this.view=null;}
            this.session.wave=1;this.bossDefeated=false;this.pvpDefeated=new Set();
            this.entities = [];
            this.bullets = [];
            this.missiles = [];
        },

        update: function(ctx, w, h, pose) {
            try {
                const now = performance.now();
                let dt = (now - this.lastTime) / 1000;
                this.lastTime = now;
                
                if (dt > 0.05) dt = 0.05; 
                if (dt < 0.001) return this.session.kills*100;

                if (!Number.isFinite(this.ship.vx)) this.ship.vx = 0;
                if (!Number.isFinite(this.ship.vy)) this.ship.vy = 0;
                if (!Number.isFinite(this.ship.vz)) this.ship.vz = 250;
                if (!Number.isFinite(this.ship.x))  this.ship.x = 0;
                if (!Number.isFinite(this.ship.y))  this.ship.y = 3000;
                if (!Number.isFinite(this.ship.z))  this.ship.z = 0;
                if (!Number.isFinite(this.ship.pitch)) this.ship.pitch = 0;
                if (!Number.isFinite(this.ship.yaw))   this.ship.yaw = 0;
                if (!Number.isFinite(this.ship.roll))  this.ship.roll = 0;

                if (this.state === 'LOBBY') { 
                    if (this.keys[' ']) {
                        if (this.mode === 'SINGLE' || this.mode === 'FREE') {
                            this.state = 'HANGAR';
                        } else if (this.net.isHost && Object.keys(this.net.players).length > 0) { 
                            if(this.net.sessionRef) this.net.sessionRef.child('state').set('HANGAR'); 
                        } else if (!this.net.isHost && this.net.playersRef) { 
                            this.net.playersRef.child(this.net.uid).update({ready: true}); 
                        }
                    }
                    this._drawLobby(ctx, w, h); 
                    return 0; 
                }

                if (this.state === 'HANGAR') {
                    if (this.keys[' ']) {
                        if (this.mode === 'SINGLE' || this.mode === 'FREE') { 
                            this.state = 'CALIBRATION'; this.timer = 5.0; 
                        } else if (this.net.isHost && this.net.sessionRef) { 
                            this.net.sessionRef.child('state').set('PLAYING'); 
                        }
                    }
                    this._drawHangar(ctx, w, h);
                    return 0;
                }
                
                this._readPose(pose, w, h, dt); 

                if (this.state === 'CALIBRATION') {
                    if(window.ArcadeControls?.mode==='controls')this.timer=5.0;
                    else if(this.pilot.active)this.timer-=dt;
                    else {
                        this.timer += dt * 2; 
                        if (this.timer > 5.0) this.timer = 5.0;
                    }
                    
                    this._drawCalib(ctx, w, h);
                    if ((window.ArcadeControls?.mode==='controls' && this.keys[' ']) ||
                       (window.ArcadeControls?.mode!=='controls' && this.pilot.active && this.timer <= 0)) {
                        this.currentStats.thrust = BASE_PLANE_STATS.thrust + ((this.upgrades.engine - 1) * 50000);
                        this.ship.maxHp = 100 + ((this.upgrades.armor - 1) * 100);
                        this.ship.hp = this.ship.maxHp;
                        this.ship.engineHealth = 100;
                        this.ship.wingHealth = 100;
                        this.ship.structuralIntegrity = 100;
                        this._startMission(); 
                    }
                    return 0;
                }

                if (this.state === 'GAMEOVER' || this.state === 'VICTORY') {
                    this._drawEnd(ctx, w, h);
                    return this.session.kills*100;
                }

                if (this.ship.hp < this.ship.maxHp) {
                    let hpRatio = this.ship.hp / this.ship.maxHp;
                    if (hpRatio < 0.4) {
                        this.ship.engineHealth *= 0.999;
                        if (Math.random() < 0.1) this.fx.push(createParticle(this.ship.x, this.ship.y, this.ship.z, "#333", 10, 1.0, 'smoke'));
                    }
                    if (hpRatio < 0.3) this.ship.wingHealth *= 0.999;
                    if (hpRatio < 0.15) {
                        this.ship.structuralIntegrity *= 0.999;
                        if (Math.random() < 0.05) this.fx.push(createParticle(this.ship.x, this.ship.y, this.ship.z, "#f30", 15, 0.5, 'fire'));
                    }
                }

                let engEff = Math.max(0.3, this.ship.engineHealth / 100);
                let wingEff = Math.max(0.3, this.ship.wingHealth / 100);
                let structEff = Math.max(0.3, this.ship.structuralIntegrity / 100);

                if ((this.mode === 'PVP' || this.mode === 'COOP') && this.net.players) {
                    Object.keys(this.net.players).forEach(uid => {
                        if (uid !== this.net.uid && this.net.players[uid] && this.net.players[uid].hp > 0) {
                            let rp = this.net.players[uid];
                            rp.x += (rp.vx || 0) * dt; 
                            rp.y += (rp.vy || 0) * dt; 
                            rp.z += (rp.vz || 0) * dt;
                            
                            if (rp.firing && Math.random() < 0.2) {
                                let tX = Math.sin(rp.yaw)*Math.cos(rp.pitch);
                                let tY = Math.sin(rp.pitch);
                                let tZ = Math.cos(rp.yaw)*Math.cos(rp.pitch);
                                this.fx.push(createParticle(rp.x+tX*50, rp.y-10, rp.z+tZ*50, "#ff0", 5, 0.2, 'tracer'));
                            }
                            if (rp.missilesFired > (rp.lastMissilesFired || 0)) {
                                rp.lastMissilesFired = rp.missilesFired;
                                this.fx.push(createParticle(rp.x, rp.y-20, rp.z, "#ff9900", 20, 1.0, 'fire'));
                            }
                        }
                    });
                }

                let altitude = Math.max(0, Math.min(GAME_CONFIG.MAX_ALTITUDE, this.ship.y));
                let tempK = 288.15 - 0.0065 * altitude; 
                let airDensity = 1.225 * Math.pow(Math.max(0, 1 - 0.0000225577 * altitude), 4.2561); 
                let speedOfSound = Math.sqrt(Math.max(1, GAME_CONFIG.GAMMA * GAME_CONFIG.R_GAS * tempK));

                let V = Math.hypot(this.ship.vx, this.ship.vy, this.ship.vz);
                if (V === 0) V = 1;
                this.ship.speed = V;
                this.ship.mach = V / speedOfSound;

                let cy = Math.cos(this.ship.yaw), sy = Math.sin(this.ship.yaw);
                let cp = Math.cos(this.ship.pitch), sp = Math.sin(this.ship.pitch);
                let cr = Math.cos(this.ship.roll), sr = Math.sin(this.ship.roll);

                let fwdX = sy * cp, fwdY = sp, fwdZ = cy * cp;
                // Positive bank means the right wing goes down and lift turns
                // the flight path to the right, consistently with positive yaw.
                let upX = -sy*sp*cr + cy*sr, upY = cp*cr, upZ = -cy*sp*cr - sy*sr;

                let vDirX = this.ship.vx/V, vDirY = this.ship.vy/V, vDirZ = this.ship.vz/V;
                let cosAlpha = fwdX*vDirX + fwdY*vDirY + fwdZ*vDirZ;
                this.ship.alpha = Math.acos(Math.max(-1, Math.min(1, cosAlpha))) || 0;

                let CL = this.ship.alpha * (this.currentStats.clMax / this.currentStats.stallAngle) + 0.5; 
                this.ship.isStalling = V < 40; 
                if (this.ship.isStalling) CL = 0.1; 

                let CD = this.currentStats.cd0 + this.currentStats.kInduced * (CL * CL);
                CD *= (1.0 + (1.0 - structEff)); 

                let dynPress = 0.5 * airDensity * (V * V);
                let liftMag = dynPress * this.currentStats.wingArea * CL;
                let dragMag = dynPress * this.currentStats.wingArea * CD;

                let liftFx = upX * liftMag, liftFy = upY * liftMag, liftFz = upZ * liftMag;
                let dragFx = -vDirX * dragMag, dragFy = -vDirY * dragMag, dragFz = -vDirZ * dragMag;
                
                let currentThrust = this.currentStats.thrust * engEff;
                if (this.ship.afterburner) {
                    this.ship.engineHeat += dt * 20;
                    if (this.ship.engineHeat < this.currentStats.overheatThreshold) {
                        currentThrust *= 1.5;
                        if(Math.random() < 0.3) this.fx.push(createParticle(this.ship.x - fwdX*30, this.ship.y - fwdY*30, this.ship.z - fwdZ*30, "#0cf", 8, 0.2, 'afterburner'));
                    } else {
                        currentThrust *= 0.5; 
                    }
                } else {
                    this.ship.engineHeat = Math.max(0, this.ship.engineHeat - dt * 10);
                }

                let thrustMag = currentThrust * this.pilot.throttle;
                let thrustFx = fwdX * thrustMag, thrustFy = fwdY * thrustMag, thrustFz = fwdZ * thrustMag;

                let weight = this.currentStats.mass * GAME_CONFIG.GRAVITY;
                let Fx = liftFx + dragFx + thrustFx;
                let Fy = liftFy + dragFy + thrustFy - weight; 
                let Fz = liftFz + dragFz + thrustFz;

                let ax = Fx / this.currentStats.mass;
                let ay = Fy / this.currentStats.mass;
                let az = Fz / this.currentStats.mass;

                let maxAccel = 15.0 * GAME_CONFIG.GRAVITY; 
                let accMag = Math.hypot(ax, ay, az);
                if (accMag > maxAccel) {
                    ax = (ax / accMag) * maxAccel; ay = (ay / accMag) * maxAccel; az = (az / accMag) * maxAccel;
                }

                this.ship.vx += ax * dt;
                this.ship.vz += az * dt;

                let targetVy = fwdY * this.ship.speed;
                this.ship.vy += (targetVy - this.ship.vy) * 5.0 * dt;

                this.ship.gForce = Math.hypot(ax, ay + GAME_CONFIG.GRAVITY, az) / GAME_CONFIG.GRAVITY;

                this.ship.x += this.ship.vx * dt;
                this.ship.y += this.ship.vy * dt;
                this.ship.z += this.ship.vz * dt;

                if(this.flightSchool){
                    const onRunway=Math.abs(this.ship.x)<105&&Math.abs(this.ship.z)<3000;
                    if(this.flightSchool.stage==='takeoff'&&this.ship.speed<65){this.ship.y=8;this.ship.vy=0;}
                    if(this.ship.y<8){
                      const gentle=onRunway&&this.ship.speed<120&&Math.abs(this.ship.vy)<10&&Math.abs(this.ship.roll)<.35;
                      this.ship.y=8;this.ship.vy=0;
                      if(this.flightSchool.stage==='landing'&&gentle){this.flightSchool.complete=true;this.flightSchool.stage='complete';this.ship.pitch=0;this.manualThrottle=0;this.flightCareer.school=true;this._saveCareer();}
                      else if(this.flightSchool.stage!=='takeoff'&&!gentle){this.flightSchool.stage='retry';}
                    }
                    if(this.flightSchool.stage==='complete'){this.ship.vx*=.97;this.ship.vz*=.97;this.pilot.targetPitch=0;this.pilot.targetRoll=0;}
                    if(this.ship.y>95&&this.flightSchool.stage==='takeoff')this.flightSchool.stage='gates';
                    const gate=this._schoolGates()[this.flightSchool.gate];
                    if(this.flightSchool.stage==='gates'&&gate&&Math.hypot(this.ship.x-gate.x,this.ship.y-gate.y,this.ship.z-gate.z)<330){this.flightSchool.gate++;if(this.flightSchool.gate===this._schoolGates().length)this.flightSchool.stage='landing';}
                }
                if (!this.flightSchool && this.ship.y < 50) {
                    this.ship.y = 50; 
                    this.ship.vy = Math.max(0, this.ship.vy); 
                    if (this.ship.pitch < 0) this.ship.pitch = 0; 
                }

                let effectiveLift = liftMag * Math.max(0.5, this.ship.inputs.pitch); 
                let turnRate = (effectiveLift * Math.sin(this.ship.roll)) / (this.currentStats.mass * V);
                let arcadeTurn = Math.sin(this.ship.roll) * Math.max(0, this.ship.inputs.pitch) * 2.0; 
                turnRate += arcadeTurn;

                if (!this.ship.isStalling && !isNaN(turnRate)) {
                    this.ship.yaw += Math.max(-2.5, Math.min(2.5, turnRate)) * dt; 
                }

                this.ship.roll += (this.pilot.targetRoll - this.ship.roll) * this.currentStats.maxRollRate * wingEff * dt;
                this.ship.pitch += (this.pilot.targetPitch - this.ship.pitch) * this.currentStats.maxPitchRate * dt;
                
                if (this.ship.isStalling) {
                    this.ship.pitch += (-0.2 - this.ship.pitch) * dt; 
                }
                this.ship.pitch = Math.max(-Math.PI/2.5, Math.min(Math.PI/2.5, this.ship.pitch));
                
                if(!this.flightSchool)this._processCombat(dt, w, h);
                this._spawnEnemies(); 
                this._updateAI(dt);
                this._updateEntities(dt, now);
                this._updateBullets(dt);
                this._updateMissiles(dt); 
                this._cleanupFx();

                if ((this.mode === 'PVP' || this.mode === 'COOP') && this.net.playersRef && this.net.uid) {
                    if (performance.now() - this.net.lastSend > 100) {
                        this.net.playersRef.child(this.net.uid).update({
                            x: this.ship.x, y: this.ship.y, z: this.ship.z,
                            pitch: this.ship.pitch, yaw: this.ship.yaw, roll: this.ship.roll,
                            vx: this.ship.vx, vy: this.ship.vy, vz: this.ship.vz,
                            timestamp: Date.now()
                        });
                        this.net.lastSend = performance.now();
                    }
                }

                if (this.ship.hp <= 0 && this.state !== 'GAMEOVER') this._endGame('GAMEOVER');

                if (this.mode === 'PVP' && this.session.kills >= 1 && this.state === 'PLAYING') {
                    this._endGame('VICTORY');
                }

                this._draw(ctx, w, h);
                return this.session.kills*100;

            } catch (err) {
                console.error("CRITICAL FLIGHT ERROR:", err);
                ctx.fillStyle = '#111'; ctx.fillRect(0, 0, w, h);
                ctx.fillStyle = '#ff0000'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'left';
                ctx.fillText("SISTEMA DE VOO EM MODO DE SEGURANÇA (RECUPERANDO)...", 50, 50);
                
                this.ship.x = 0; this.ship.y = 3000; this.ship.z = 0;
                this.ship.vx = 0; this.ship.vy = 0; this.ship.vz = 250;
                this.state = 'HANGAR'; 
                
                return 0;
            }
        },

        _readPose: function(pose, w, h, dt) {
            let trgRoll = 0, trgPitch = 0, inputDetected = false;
            this.pilot.headTilt = false; 
            
            if (this.keys['ArrowUp']) trgPitch = (window.ArcadePlaySettings?.get().sensitivity??1); else if (this.keys['ArrowDown']) trgPitch = -(window.ArcadePlaySettings?.get().sensitivity??1);
            if (this.keys['ArrowRight']) trgRoll = (window.ArcadePlaySettings?.get().sensitivity??1); else if (this.keys['ArrowLeft']) trgRoll = -(window.ArcadePlaySettings?.get().sensitivity??1);
            if (this.keys[' ']) this.pilot.headTilt = true;
            if (this.keys['Shift']) this.ship.afterburner = true; else this.ship.afterburner = false;
            if (this.keys['ArrowUp'] || this.keys['ArrowDown'] || this.keys['ArrowLeft'] || this.keys['ArrowRight']) inputDetected = true;

            if(window.ArcadeControls?.mode==='controls'&&this.manualStick?.active){trgRoll=this.manualStick.x*(window.ArcadePlaySettings?.get().sensitivity??1);trgPitch=this.manualStick.y*(window.ArcadePlaySettings?.get().sensitivity??1);inputDetected=Math.hypot(this.manualStick.x,this.manualStick.y)>.001;}
            let pts = null;
            if (pose && Array.isArray(pose)) pts = pose;
            else if (pose && pose.keypoints) pts = pose.keypoints;
            else if (pose && Array.isArray(pose) && pose[0] && pose[0].keypoints) pts = pose[0].keypoints;

            if (window.ArcadeControls?.mode!=='controls' && pts && pts.length > 0) {
                let rightWrist = null, leftWrist = null;
                for (let i = 0; i < pts.length; i++) {
                    let k = pts[i];
                    if (!k) continue;
                    if ((k.name === 'right_wrist' || k.part === 'right_wrist' || i === 10) && k.score > 0.3) rightWrist = k;
                    if ((k.name === 'left_wrist' || k.part === 'left_wrist' || i === 9) && k.score > 0.3) leftWrist = k;
                }
                
                if (rightWrist && leftWrist) {
                    inputDetected = true;
                    const videoW=window.System?.video?.videoWidth||640,videoH=window.System?.video?.videoHeight||480;
                    let rx = (1 - ((rightWrist.x || 0) / videoW)) * w;
                    let ry = ((rightWrist.y || 0) / videoH) * h;
                    let lx = (1 - ((leftWrist.x || 0) / videoW)) * w;
                    let ly = ((leftWrist.y || 0) / videoH) * h;
                    
                    // Anatomical wrist names swap sides in the mirrored view.
                    // A level pair must always yield zero, never atan2(0,-span)=π.
                    const rightIsOnRight=rx>lx;
                    const slope=(rightIsOnRight?ry-ly:ly-ry);
                    let rollInput=Math.atan2(slope,Math.max(1,Math.abs(rx-lx)))*1.8;
                    trgRoll=Math.max(-1,Math.min(1,rollInput))*(window.ArcadePlaySettings?.get().sensitivity??1);
                    
                    let avgY = (ry + ly) / 2;
                    if (this.state === 'CALIBRATION') {
                        this.pilot.baseY = this.pilot.baseY * 0.95 + avgY * 0.05;
                        if (!this.pilot.baseY) this.pilot.baseY = avgY;
                    } else {
                        let deltaY = avgY - this.pilot.baseY;
                        let safeH = h > 0 ? h : 100; 
                        
                        // FIX V35: PONTO DOCE DO YOKE. 0.09 é o balanço exato entre cansaço (0.15) e jitter (0.05)
                        let pitchInput = -deltaY / (safeH * 0.09); 
                        
                        trgPitch = Math.max(-1.0, Math.min(1.0, pitchInput || 0)); 
                    }

                    let handsDist = Math.hypot(rx - lx, ry - ly);
                    if (handsDist < w * 0.25 && this.state === 'PLAYING') {
                        this.pilot.headTilt = true; 
                    }
                    if (handsDist > w * 0.5) {
                        this.ship.afterburner = true; 
                    } else {
                        this.ship.afterburner = false;
                    }
                }
            }

            if (inputDetected) {
                this.pilot.active = true;
                this.pilot.targetRoll += (trgRoll - this.pilot.targetRoll) * 12 * dt;
                this.pilot.targetPitch += (trgPitch - this.pilot.targetPitch) * 12 * dt;
            } else {
                this.pilot.active = false;
                this.pilot.targetRoll *= 0.9;
                this.pilot.targetPitch *= 0.9;
            }
            
            if(window.ArcadeControls?.mode==='controls'){
                this.pilot.active=true;
                this.pilot.throttle=Math.max(0,Math.min(1,this.manualThrottle??1));
                if(!inputDetected&&window.ArcadePlaySettings?.get().assist===false){this.pilot.targetRoll=this.ship.roll;this.pilot.targetPitch=this.ship.pitch;}
                if(!inputDetected&&window.ArcadePlaySettings?.get().assist!==false){this.pilot.targetRoll*=Math.exp(-dt*5);this.pilot.targetPitch*=Math.exp(-dt*5);}
            }
            this.ship.inputs.pitch = this.pilot.targetPitch;
            this.ship.inputs.roll = this.pilot.targetRoll;
        },

        _processCombat: function(dt, w, h) {
            const previous=this.combat.target,wasLocked=this.combat.locked;
            this.combat.target=null;this.combat.locked=false;let closestAngle=Infinity;
            
            const scan = (obj, isPlayer, uid) => {
                let p = Engine3D.project(obj.x, obj.y, obj.z, this.ship.x, this.ship.y, this.ship.z, this.ship.pitch, this.ship.yaw, this.ship.roll, w, h);
                let dx = obj.x - this.ship.x, dy = obj.y - this.ship.y, dz = obj.z - this.ship.z;
                let dist = Math.hypot(dx, dy, dz);
                if (dist < 1) dist = 1;
                
                const angle=p.visible?Math.hypot(p.x-w/2,p.y-h/2)/800:Infinity;
                // Six degrees around the aircraft's sight, not an entire forward
                // hemisphere. Keep the same adversary in sight for acquisition.
                if (obj.hp>0 && p.visible && p.z>200 && dist<30000 && angle<Math.tan(Math.PI/30) && angle<closestAngle) {
                    closestAngle=angle;
                    this.combat.target = isPlayer ? {x:obj.x, y:obj.y, z:obj.z, vx:obj.vx||0, vy:obj.vy||0, vz:obj.vz||0, hp:obj.hp, isPlayer:true, uid:uid} : obj;
                }
            };

            this.entities.forEach(e => { if(e.type && (e.type.startsWith('jet') || e.type === 'boss')) scan(e, false); });

            if (this.mode === 'PVP' && this.net.players) {
                Object.keys(this.net.players).forEach(id => {
                    if (id !== this.net.uid && this.net.players[id]?.hp > 0) scan(this.net.players[id], true, id);
                });
            }

            const same=this.combat.target&&previous&&(this.combat.target.isPlayer?previous.isPlayer&&previous.uid===this.combat.target.uid:previous===this.combat.target);
            if(!same)this.combat.lockTimer=0;
            if (this.combat.target) {
                this.combat.lockTimer += dt;
                if (this.combat.lockTimer >= 0.65) {
                    if (!wasLocked||!same) GameSfx.play('lock');
                    this.combat.locked = true;
                    this.combat.lockTimer = 0.65;
                }
            } else {
                this.combat.lockTimer=0;
            }

            let firingState = false;

            if ((window.ArcadeControls?.mode!=='controls'||this.manualFireHeld||this.keys['f']) && this.combat.locked && this.combat.target && performance.now() - this.combat.vulcanCd > 80) {
                this.combat.vulcanCd = performance.now();
                let spd = this.ship.speed + 1200;
                
                let tX = this.combat.target.x + (this.combat.target.vx || 0) * 0.1;
                let tY = this.combat.target.y + (this.combat.target.vy || 0) * 0.1;
                let tZ = this.combat.target.z + (this.combat.target.vz || 0) * 0.1;

                let dx = tX - this.ship.x, dy = tY - this.ship.y, dz = tZ - this.ship.z;
                let distLead = Math.hypot(dx,dy,dz);
                if (distLead < 1) distLead = 1;

                this.bullets.push({
                    x: this.ship.x + Math.cos(this.ship.yaw)*60, y: this.ship.y-20, z: this.ship.z - Math.sin(this.ship.yaw)*60,
                    vx: this.ship.vx + (dx/distLead)*spd, vy: this.ship.vy + (dy/distLead)*spd, vz: this.ship.vz + (dz/distLead)*spd,
                    isEnemy: false, life: 2
                });
                GameSfx.play('vulcan');
                firingState = true;
            }

            if (this.combat.missileCd > 0) this.combat.missileCd -= dt;

            if (this.combat.locked && this.pilot.headTilt && this.combat.missileCd <= 0) {
                if (Math.random() < 0.95) { 
                    this.missiles.push({
                        x: this.ship.x, y: this.ship.y-50, z: this.ship.z,
                        vx: this.ship.vx, vy: this.ship.vy, vz: this.ship.vz,
                        target: this.combat.target, life: 10, maxG: 40 + (this.upgrades.missiles * 5), trackTime: 0
                    });
                    GameSfx.play('missile');
                    if ((this.mode === 'PVP' || this.mode === 'COOP') && this.net.playersRef && this.net.uid) {
                        this.net.playersRef.child(this.net.uid).child('missilesFired').transaction(current => (current || 0) + 1);
                    }
                }
                this.combat.missileCd = Math.max(0.5, 1.5 - (this.upgrades.missiles * 0.2)); 
            }

            if ((this.mode === 'PVP' || this.mode === 'COOP') && this.net.playersRef) {
                if (performance.now() - this.net.lastSend > 100) {
                    this.net.playersRef.child(this.net.uid).update({ firing: firingState, timestamp: Date.now() });
                    this.net.lastSend = performance.now();
                }
            }
        },

        _spawnEnemies: function() {
            if (this.mode === 'PVP' || this.mode === 'FREE') return; 
            
            let currentKills = this.session.kills;
            if (this.mode === 'COOP' && this.net.sharedData) currentKills = this.net.sharedData.teamKills || this.session.kills;

            let maxEnemies = this.session.wave * 3;
            if (this.entities.filter(e => e.type && e.type.startsWith('jet')).length >= maxEnemies || Math.random() > 0.05) return;
            
            let dist = 8000 + Math.random()*10000;
            let fX = Math.sin(this.ship.yaw) * Math.cos(this.ship.pitch);
            let fZ = Math.cos(this.ship.yaw) * Math.cos(this.ship.pitch);
            let sx = this.ship.x + fX*dist + (Math.random()-0.5)*15000;
            let sz = this.ship.z + fZ*dist + (Math.random()-0.5)*15000;
            
            this.entities.push({ 
                type: 'jet_fighter', state: 'PATROL', x: sx, y: Math.max(1000, this.ship.y+(Math.random()-0.5)*4000), z: sz, 
                vx: -fX*250, vy: 0, vz: -fZ*250, hp: 150 * this.session.wave, yaw: this.ship.yaw + Math.PI, roll: 0, pitch: 0,
                target: null, stateTimer: 0, active: true, engineHealth: 100, wingHealth: 100, structuralIntegrity: 100
            });
        },

        _updateAI: function(dt) {
            this.entities.forEach(e => {
                if (!e.active || !(e.type && (e.type.startsWith('jet') || e.type === 'boss'))) return;

                e.stateTimer -= dt;
                
                let target = this.ship;
                let minDist = Math.hypot(this.ship.x - e.x, this.ship.y - e.y, this.ship.z - e.z);
                
                if ((this.mode === 'COOP' || this.mode === 'PVP') && this.net.players) {
                    Object.keys(this.net.players).forEach(uid => {
                        let rp = this.net.players[uid];
                        if (rp && rp.hp > 0) {
                            let d = Math.hypot(rp.x - e.x, rp.y - e.y, rp.z - e.z);
                            if (d < minDist) { minDist = d; target = rp; }
                        }
                    });
                }

                let tX = target.x, tY = target.y, tZ = target.z;

                let dx = target.x - e.x, dy = target.y - e.y, dz = target.z - e.z;
                let directYaw = Math.atan2(dx, dz);
                let yawDiffToPlayer = directYaw - e.yaw;
                while (yawDiffToPlayer > Math.PI) yawDiffToPlayer -= Math.PI * 2;
                while (yawDiffToPlayer < -Math.PI) yawDiffToPlayer += Math.PI * 2;

                if (e.stateTimer <= 0) {
                    if (e.hp < 30) e.state = 'RETREAT';
                    else if (e.isBoss && e.hp < 1000 && Math.random() < 0.3) e.state = 'BOSS_PHASE';
                    else if (minDist < 2000) e.state = 'EVADE'; 
                    else if (minDist > 12000) e.state = 'INTERCEPT';
                    else {
                        e.state = Math.random() > 0.4 ? 'TAIL' : 'ENGAGE';
                    }
                    e.stateTimer = 1.0 + Math.random() * 1.5; 
                }

                if (e.state === 'TAIL') {
                    tX = target.x - Math.sin(target.yaw) * 2000;
                    tZ = target.z - Math.cos(target.yaw) * 2000;
                    tY = target.y + 300; 
                }
                
                let movDx = tX - e.x, movDy = tY - e.y, movDz = tZ - e.z;
                let targetYaw = Math.atan2(movDx, movDz);
                let targetPitch = Math.atan2(movDy, Math.hypot(movDx, movDz));

                let yawDiff = targetYaw - e.yaw;
                while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
                while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
                
                if (e.state === 'EVADE') {
                    targetYaw += Math.PI/2; 
                    e.roll += (Math.PI/2 - e.roll) * 3 * dt;
                } else if (e.state === 'VERTICAL_MANEUVER') {
                    targetPitch += Math.PI/3; 
                    e.roll += (Math.PI - e.roll) * 3 * dt;
                } else if (e.state === 'RETREAT') {
                    targetYaw += Math.PI; 
                    targetPitch = 0.2;
                    e.roll += (0 - e.roll) * 2 * dt;
                } else {
                    e.roll += (yawDiff * 3.0 - e.roll) * 4 * dt;
                }
                
                let newYawDiff = targetYaw - e.yaw;
                while (newYawDiff > Math.PI) newYawDiff -= Math.PI * 2;
                while (newYawDiff < -Math.PI) newYawDiff += Math.PI * 2;
                
                let wingEff = e.wingHealth ? Math.max(0.3, e.wingHealth / 100) : 1.0;
                
                e.yaw += newYawDiff * (e.isBoss ? 2.0 : 1.5) * wingEff * dt;
                e.pitch += (targetPitch - e.pitch) * (e.isBoss ? 2.0 : 1.5) * wingEff * dt;
                
                let speed = e.isBoss ? 450 : (e.state === 'EVADE' ? 380 : 320);
                let engEff = e.engineHealth ? Math.max(0.3, e.engineHealth / 100) : 1.0;
                speed *= engEff;
                
                e.vx = Math.sin(e.yaw) * Math.cos(e.pitch) * speed || 0;
                e.vy = Math.sin(e.pitch) * speed || 0;
                e.vz = Math.cos(e.yaw) * Math.cos(e.pitch) * speed || 0;

                if (minDist < 10000 && Math.abs(yawDiffToPlayer) < 0.3 && (e.state === 'INTERCEPT' || e.state === 'ENGAGE' || e.state === 'TAIL')) {
                    if (Math.random() < (e.isBoss ? 0.1 : 0.03)) { 
                        let bSpd = 800; 
                        if (minDist < 1) minDist = 1;
                        this.bullets.push({
                            x: e.x, y: e.y, z: e.z,
                            vx: e.vx + (dx/minDist)*bSpd, vy: e.vy + (dy/minDist)*bSpd, vz: e.vz + (dz/minDist)*bSpd,
                            isEnemy: true, life: 3.5
                        });
                    }
                }
            });
        },

        _updateMissionSystem: function() {
            if (this.mode === 'PVP' || this.mode === 'FREE') return;
            
            let currentKills = this.session.kills;
            if (this.mode === 'COOP' && this.net.sharedData) {
                currentKills = this.net.sharedData.teamKills || this.session.kills;
            }

            if (currentKills >= 15 && this.session.wave === 1) {
                this.session.wave = 2;
                if(window.System && window.System.msg) window.System.msg("WAVE 2: INIMIGOS REFORÇADOS", "#ffcc00");
                if (this.net.isHost && this.net.sharedRef) this.net.sharedRef.update({wave: 2});
            } else if (currentKills >= 30 && this.session.wave === 2) {
                this.session.wave = 3;
                if(window.System && window.System.msg) window.System.msg("WAVE 3: O CHEFÃO CHEGOU!", "#ff3300");
                if (this.net.isHost && this.net.sharedRef) this.net.sharedRef.update({wave: 3});
                
                let fX = Math.sin(this.ship.yaw) * Math.cos(this.ship.pitch);
                let fZ = Math.cos(this.ship.yaw) * Math.cos(this.ship.pitch);
                this.entities.push({ 
                    type: 'boss', state: 'ENGAGE', x: this.ship.x + fX*12000, y: this.ship.y+2000, z: this.ship.z + fZ*12000, 
                    vx: -fX*350, vy: 0, vz: -fZ*350, hp: 2000, yaw: this.ship.yaw + Math.PI, roll: 0, pitch: 0, isBoss: true, active: true, stateTimer: 0, engineHealth: 100, wingHealth: 100, structuralIntegrity: 100 
                });
            } else if (currentKills >= 31 && this.session.wave === 3) {
                this.session.xp += 1000; 
                this._endGame('VICTORY');
            }
        },

        _updateEntities: function(dt, now) {
            for (let e of this.entities) {
                e.x += e.vx*dt; e.y += e.vy*dt; e.z += e.vz*dt;
                if (e.y < 100) e.y = 100;
                
                let dx = this.ship.x - e.x, dy = this.ship.y - e.y, dz = this.ship.z - e.z;
                if (Math.hypot(dx, dy, dz) > 120000 && !e.isBoss) { e.hp = -1; }
            }
            this.entities = this.entities.filter(e => e.hp > 0);
            this._updateMissionSystem();
        },

        _updateBullets: function(dt) {
            for (let i = this.bullets.length-1; i >= 0; i--) {
                let b = this.bullets[i];
                b.x += b.vx*dt; b.y += b.vy*dt; b.z += b.vz*dt; b.life -= dt;
                if (b.isEnemy) {
                    if (Math.hypot(b.x-this.ship.x, b.y-this.ship.y, b.z-this.ship.z) < 80) {
                        let randHit = Math.random();
                        if (randHit < 0.3) this.ship.engineHealth -= 10;
                        else if (randHit < 0.6) this.ship.wingHealth -= 10;
                        else this.ship.structuralIntegrity -= 10;

                        this.ship.hp -= 10;
                        if (window.Gfx && window.Gfx.shakeScreen) window.Gfx.shakeScreen(15);
                        
                        // 5: Emoção ao ser atingido (Vibração e Som de Impacto)
                        if (navigator.vibrate) navigator.vibrate([200, 50, 200]);
                        GameSfx.play('hit');
                        
                        b.life = 0;
                    }
                } else {
                    for (let e of this.entities) {
                        if (Math.hypot(b.x-e.x, b.y-e.y, b.z-e.z) < (e.isBoss? 300 : 150)) {
                            if (this.mode === 'SINGLE' || this.mode === 'FREE' || this.net.isHost) {
                                e.hp -= 50; 
                                let randHit = Math.random();
                                if (randHit < 0.3) e.engineHealth -= 10;
                                else if (randHit < 0.6) e.wingHealth -= 10;
                                else e.structuralIntegrity -= 10;
                                if (e.hp <= 0) this._kill(e, e.isBoss?2000:150);
                            }
                            b.life = 0;
                            this._fx(e.x,e.y,e.z,'#f90',4,40);
                            break;
                        }
                    }
                    
                    if (this.mode==='PVP' && b.life>0 && this.net.players) {
                        Object.keys(this.net.players).forEach(uid => {
                            if (uid!==this.net.uid && this.net.players[uid]?.hp>0 && Math.hypot(b.x-this.net.players[uid].x, b.y-this.net.players[uid].y, b.z-this.net.players[uid].z)<150) {
                                b.life=0;
                                this._fx(this.net.players[uid].x,this.net.players[uid].y,this.net.players[uid].z,'#f90',4,50);
                                if (window.DB && window.DB.ref) {
                                    let newHp = this.net.players[uid].hp - 10;
                                    window.DB.ref(`sessions/flight_${this.mode}/players/${uid}/hp`).set(newHp);
                                    if (newHp <= 0 && this.state === 'PLAYING') {
                                        this._pvpKill(uid);
                                    }
                                }
                            }
                        });
                    }
                    if (b.y < 0) { b.life = 0; this._fx(b.x,0,b.z,'#789',3,50); }
                }
                if (b.life <= 0) this.bullets.splice(i,1);
            }
        },

        _updateMissiles: function(dt) {
            for (let i = this.missiles.length-1; i >= 0; i--) {
                let m = this.missiles[i];
                let V = Math.hypot(m.vx, m.vy, m.vz);
                if (V < 1) V = 1;

                m.trackTime = (m.trackTime || 0) + dt;

                if (m.target && (m.target.hp>0 || m.target.isPlayer)) {
                    let rx = m.target.x - m.x, ry = m.target.y - m.y, rz = m.target.z - m.z;
                    let dist = Math.hypot(rx, ry, rz);
                    if (dist < 1) dist = 1;
                    let dist2 = dist * dist;
                    
                    if (dist < 100) { 
                        if (m.target.isPlayer && this.mode==='PVP') {
                            if (window.DB && window.DB.ref) {
                                let newHp = m.target.hp - 50;
                                window.DB.ref(`sessions/flight_${this.mode}/players/${m.target.uid}/hp`).set(newHp);
                                if (newHp <= 0 && this.state === 'PLAYING') {
                                    this._pvpKill(m.target.uid);
                                }
                            }
                            this._fx(m.target.x,m.target.y,m.target.z,'#f33',40,300);
                        } else if (!m.target.isPlayer) {
                            if (this.mode === 'SINGLE' || this.mode === 'FREE' || this.net.isHost) {
                                m.target.hp -= 400 + (this.upgrades.missiles * 100);
                                if (m.target.hp <= 0) this._kill(m.target, m.target.isBoss?2000:300);
                            }
                            this._fx(m.target.x,m.target.y,m.target.z,'#f33',40,300);
                        }
                        m.life = 0;
                    } else {
                        let vDirX = m.vx/V, vDirY = m.vy/V, vDirZ = m.vz/V;
                        let tDirX = rx/dist, tDirY = ry/dist, tDirZ = rz/dist;
                        let dot = vDirX*tDirX + vDirY*tDirY + vDirZ*tDirZ;
                        
                        if (dot < 0.4 || Math.random() < 0.005 || m.trackTime > 15) { 
                            m.target = null; 
                        }

                        if (m.target) {
                            let tx = m.target.vx || 0, ty = m.target.vy || 0, tz = m.target.vz || 0;
                            let vrx = tx - m.vx, vry = ty - m.vy, vrz = tz - m.vz;
                            
                            let cx = ry * vrz - rz * vry, cy = rz * vrx - rx * vrz, cz = rx * vry - ry * vrx;
                            let omx = cx/dist2, omy = cy/dist2, omz = cz/dist2;
                            
                            let Vc = -(rx*vrx + ry*vry + rz*vrz) / dist;
                            
                            let oxux = omy*tDirZ - omz*tDirY, oxuy = omz*tDirX - omx*tDirZ, oxuz = omx*tDirY - omy*tDirX;
                            
                            let N = 5.0;
                            let ax = N * Vc * oxux, ay = N * Vc * oxuy, az = N * Vc * oxuz;
                            
                            let accMag = Math.hypot(ax, ay, az);
                            let maxAcc = m.maxG * GAME_CONFIG.GRAVITY;
                            if (accMag > maxAcc) { ax = (ax/accMag)*maxAcc; ay = (ay/accMag)*maxAcc; az = (az/accMag)*maxAcc; }
                            
                            if (!isNaN(ax)) { m.vx += ax*dt; m.vy += ay*dt; m.vz += az*dt; }
                        }
                    }
                }
                
                let vDirX = m.vx/V, vDirY = m.vy/V, vDirZ = m.vz/V;
                m.vx += vDirX * 800 * dt; m.vy += vDirY * 800 * dt; m.vz += vDirZ * 800 * dt;

                m.x += m.vx*dt; m.y += m.vy*dt; m.z += m.vz*dt; m.life -= dt;
                this.fx.push(createParticle(m.x, m.y, m.z, 'rgba(255,200,100,0.8)', 8, 0.5, 'smoke'));
                if (m.life <= 0) this.missiles.splice(i,1);
            }
        },

        _cleanupFx: function() {
            for (let c of this.clouds) {
                if (Math.hypot(c.x-this.ship.x, c.z-this.ship.z) > 120000) {
                    let fX = Math.sin(this.ship.yaw) * Math.cos(this.ship.pitch);
                    let fZ = Math.cos(this.ship.yaw) * Math.cos(this.ship.pitch);
                    c.z = this.ship.z + fZ*90000 + (Math.random()-0.5)*50000;
                    c.x = this.ship.x + fX*90000 + (Math.random()-0.5)*50000;
                }
            }
            this.floaters = this.floaters.filter(f => { f.life -= 1/60; f.y -= 80/60; return f.life > 0; });
            
            if (this.fx.length > 150) this.fx.splice(0, this.fx.length - 150);
            this.fx = this.fx.filter(f => { f.x+=f.vx/60; f.y+=f.vy/60; f.z+=f.vz/60; f.life-=1/60; return f.life>0; });
        },

        _fx: function(x, y, z, c, n, s) {
            for(let i=0; i<n; i++) {
                this.fx.push(createParticle(x, y, z, c, s + Math.random()*200, 1+Math.random(), 'explosion'));
            }
        },

        _pvpKill: function(uid){
            if(!this.pvpDefeated)this.pvpDefeated=new Set();if(this.pvpDefeated.has(uid))return false;this.pvpDefeated.add(uid);
            this.session.kills++;this.session.cash+=500;this.session.xp+=100;this.flightCareer.kills++;this._saveCareer();
            if(window.Profile){window.Profile.coins=this.session.cash;window.Profile.xp=this.session.xp;}
            const id=window.System?.playerId;if(window.DB&&id){window.DB.ref('users/'+id+'/coins').set(this.session.cash);window.DB.ref('users/'+id+'/xp').transaction(x=>(Number(x)||0)+100);}return true;
        },
        _kill: function(t, rew) {
            if(t.rewarded)return;t.rewarded=true;if(t.isBoss)this.bossDefeated=true;
            GameSfx.play('boom');
            this._fx(t.x,t.y,t.z,'#f33',40,300);
            this._fx(t.x,t.y,t.z,'#234',30,600);
            
            // 1: Remover o valor R$ da tela para reduzir poluição visual no combate (Comentado para manter a estrutura)
            // this.floaters.push({x:t.x,y:t.y,z:t.z,text:`+ R$ ${rew}`,life:2});
            
            this.session.kills++;
            this.session.cash += rew;
            this.session.xp += rew;
            this.flightCareer.kills++;this._saveCareer();
            if(window.Profile){window.Profile.coins=this.session.cash;window.Profile.xp=this.session.xp;}
            
            if (this.mode === 'COOP' && this.net.sharedRef) {
                let teamKills = (this.net.sharedData.teamKills || 0) + 1;
                this.net.sharedRef.update({ teamKills: teamKills });
            }

            let realId = window.System && window.System.playerId;
            if (window.DB && realId) {
                window.DB.ref('users/' + realId + '/coins').set(this.session.cash);
                window.DB.ref('users/' + realId + '/xp').transaction(current => (Number(current)||0)+rew);
            }
        },

        _endGame: function(res) {
            this.state = res;
            GameSfx.stop();
            setTimeout(() => {
                if (window.System && window.System.gameOver) window.System.gameOver(this.session.kills*100,res==='VICTORY',0);
                else if (window.System && window.System.home) window.System.home();
            }, 2000);
        },

        _schoolGates: function(){return[{x:0,y:230,z:0},{x:1000,y:450,z:1900},{x:2300,y:480,z:0},{x:1200,y:300,z:-2600},{x:0,y:120,z:-2300}];},
        _drawSchool: function(ctx,w,h){
            const quad=(points,color)=>{const pp=points.map(p=>this._projectView(...p,w,h));if(pp.some(p=>!p.visible))return;ctx.beginPath();pp.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=color;ctx.fill();};
            // One continuous runway at ground level, rendered in the same camera space.
            for(let z=-3000;z<3000;z+=100){quad([[-110,0,z],[110,0,z],[110,0,z+100],[-110,0,z+100]],'#394856');if(z%300===0)quad([[-4,.3,z],[4,.3,z],[4,.3,z+65],[-4,.3,z+65]],'#f4f2d9');}
            const school=this.flightSchool,gate=this._schoolGates()[school.gate];
            if(school.stage==='gates'&&gate){const center=this._projectView(gate.x,gate.y,gate.z,w,h);if(center.visible){const radius=Math.min(w*.28,Math.max(7,300*center.s));ctx.strokeStyle='#88e9e1';ctx.lineWidth=3;ctx.beginPath();ctx.arc(center.x,center.y,radius,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#fff';ctx.font='bold 12px Arial';ctx.textAlign='center';ctx.fillText((school.gate+1)+'/5',center.x,center.y-radius-10);}else{ctx.fillStyle='#ffdc88';ctx.font='bold 12px Arial';ctx.textAlign='center';ctx.fillText('VIRE PARA O PRÓXIMO ARCO',w/2,h*.30);}}
            const labels={takeoff:'DECOLAGEM • acelere; acima de 235 km/h, suba suavemente',gates:'CURVAS • atravesse o arco '+(school.gate+1)+'/5',landing:'POUSO • alinhe à pista, reduza potência e desça suavemente',complete:'TREINAMENTO CONCLUÍDO • decolagem, curvas e pouso',retry:'APROXIMAÇÃO INSTÁVEL • use Pausa → Escolher fase para repetir'};
            ctx.save();ctx.fillStyle='rgba(6,21,37,.85)';ctx.fillRect(w*.07,h*.19,w*.86,33);ctx.fillStyle=school.complete?'#a6f1bd':'#e4f5ff';ctx.font='bold '+Math.min(14,Math.max(10,w*.028))+'px Arial';ctx.textAlign='center';ctx.fillText(labels[school.stage]||'',w/2,h*.19+21,w*.82);ctx.restore();
        },
        updateAudio: function(){
            if(!GameSfx.ctx||!GameSfx.engineGain)return;
            const opts=window.ArcadePlaySettings?.get()||{},active=this.state==='PLAYING'&&!window.System?.paused&&!document.hidden,t=GameSfx.ctx.currentTime,power=this.pilot.throttle||0;
            GameSfx.engineGain.gain.setTargetAtTime(active?(.065+power*.1+(this.ship.afterburner ? .035 : 0))*(opts.engineVolume??1):0,t,.1);
            GameSfx.engineFilter.frequency.setTargetAtTime(220+power*700+Math.min(1500,this.ship.speed*1.3),t,.16);
        },
        _updateView: function(w,h){
            const opts=window.ArcadePlaySettings?.get()||{},p=this.ship;
            if(opts.camera==='cockpit'){this.view={x:p.x,y:p.y,z:p.z,pitch:p.pitch,yaw:p.yaw,roll:p.roll};return;}
            const distance={near:180,medium:280,far:420}[opts.distance]||420;
            let v=this.view;
            if(!v||Math.hypot(v.x-p.x,v.y-p.y,v.z-p.z)>distance*5)v=this.view={x:p.x,y:p.y,z:p.z,pitch:p.pitch-.10,yaw:p.yaw,roll:0};
            const blend=.18,angle=(a,b)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*blend;
            v.yaw=angle(v.yaw,p.yaw);v.pitch+=(p.pitch-.10-v.pitch)*blend;v.roll+=(Math.max(-.34,Math.min(.34,p.roll*.23))-v.roll)*.12;
            // Position relative to aircraft, not frame-lagged world position: no fly-through on tight turns.
            v.x=p.x-Math.sin(v.yaw)*Math.cos(p.pitch)*distance;
            v.y=p.y-Math.sin(p.pitch)*distance+distance*.16;
            v.z=p.z-Math.cos(v.yaw)*Math.cos(p.pitch)*distance;
        },
        _projectView: function(x,y,z,w,h){const v=this.view||this.ship;return Engine3D.project(x,y,z,v.x,v.y,v.z,v.pitch,v.yaw,v.roll,w,h);},
        _airframePoint: function([x,y,z]){
            if(this.airframe==='interceptor'){x*=.87;z*=1.12;}else if(this.airframe==='sentinel'){x*=1.12;y*=1.07;}
            const p=this.ship,cr=Math.cos(p.roll),sr=Math.sin(p.roll),cp=Math.cos(p.pitch),sp=Math.sin(p.pitch),cy=Math.cos(p.yaw),sy=Math.sin(p.yaw);
            const rx=x*cr+y*sr,ry=-x*sr+y*cr,py=ry*cp+z*sp,pz=z*cp-ry*sp;
            return {x:p.x+rx*cy+pz*sy,y:p.y+py,z:p.z-rx*sy+pz*cy};
        },
        _airframeMesh: function(){
            if(this.airframeMesh)return this.airframeMesh;
            const faces=[],add=(vertices,color)=>faces.push({vertices,color});
            const shell=(rings,color,steps=10)=>{
                const points=rings.map(([z,rx,ry,y=0,x=0])=>Array.from({length:steps},(_,i)=>{const t=i*Math.PI*2/steps;return[x+Math.cos(t)*rx,y+Math.sin(t)*ry,z];}));
                for(let j=0;j<points.length-1;j++)for(let i=0;i<steps;i++)add([points[j][i],points[j][(i+1)%steps],points[j+1][(i+1)%steps],points[j+1][i]],color);
            };
            // Closed volumes: ogive nose, fuselage, glass canopy, twin engines,
            // swept wings, horizontal stabilizers and canted vertical fins.
            shell([[-29,3,3],[-23,5.1,4.2],[-10,5.8,4.4],[5,4.8,4.5],[20,3.3,3.1],[33,1.8,1.8],[40,.12,.12]],[132,158,176]);
            shell([[-5,.2,.2,4],[0,2.8,2,4],[8,3.1,2.6,4],[17,1.4,1.5,3],[21,.1,.1,2.8]],[34,91,124],12);
            for(const side of [-1,1]){
                shell([[-32,2.6,2.6,-.5,side*4.1],[-26,3.4,3.1,-.5,side*4.1],[-8,3.2,3,-.4,side*4.1],[1,2.7,2.2,-.3,side*4.1]],[87,111,131]);
                shell([[-32.8,2.15,2.15,-.5,side*4.1],[-32.9,.1,.1,-.5,side*4.1]],[28,36,48]);
                const wing=(outline,thickness,color)=>{
                    const top=outline.map(([x,y,z])=>[x*side,y+thickness,z]),bottom=outline.map(([x,y,z])=>[x*side,y-thickness,z]);
                    add(top,color);add([...bottom].reverse(),color.map(c=>c*.65));
                    for(let i=0;i<top.length;i++)add([top[i],bottom[i],bottom[(i+1)%top.length],top[(i+1)%top.length]],color.map(c=>c*.8));
                };
                wing([[4,-.2,13],[31,-.9,-13],[29,-.9,-20],[5,-.2,-13]],.65,[154,178,195]);
                wing([[3,1,-20],[15,1,-29],[13,1,-34],[3,1,-29]],.4,[132,158,180]);
                const fin=[[side*3.7,1,-17],[side*7.2,12,-25],[side*7,12,-31],[side*4,1,-32]];
                add(fin,[169,189,200]);add(fin.map(([x,y,z])=>[x+side*.65,y,z]).reverse(),[92,122,146]);
                add([[side*27,-.15,-12],[side*29,-.15,-14],[side*27,-.15,-16],[side*25,-.15,-14]],[215,90,62]);
            }
            return this.airframeMesh=faces;
        },
        _drawOwnPlane: function(ctx,w,h){
            if(window.ArcadePlaySettings?.get().camera==='cockpit')return;
            const project=v=>{const p=this._airframePoint(v);return this._projectView(p.x,p.y,p.z,w,h);};
            const surfaces=this._airframeMesh().map(face=>{
                const world=face.vertices.map(v=>this._airframePoint(v)),pts=world.map(v=>this._projectView(v.x,v.y,v.z,w,h));
                const a=world[0],b=world[1],c=world[2],ux=b.x-a.x,uy=b.y-a.y,uz=b.z-a.z,vx=c.x-a.x,vy=c.y-a.y,vz=c.z-a.z;
                const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,length=Math.hypot(nx,ny,nz)||1;
                const light=.55+.45*Math.abs((nx*.3+ny*.85+nz*.43)/length);
                return{pts,z:pts.reduce((n,p)=>n+(p.z||0),0)/pts.length,color:face.color.map(v=>Math.round(v*light))};
            }).sort((a,b)=>b.z-a.z);
            for(const f of surfaces){if(f.pts.some(p=>!p.visible))continue;ctx.beginPath();f.pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle='rgb('+f.color.join(',')+')';ctx.fill();ctx.strokeStyle='rgba(29,51,67,.24)';ctx.lineWidth=.45;ctx.stroke();}
            if(this.pilot.throttle>.1){
                for(const side of [-1,1]){const length=this.ship.afterburner?19:4+this.pilot.throttle*4,points=[[side*4.1-1.7,-.5,-33],[side*4.1+1.7,-.5,-33],[side*4.1,-.5,-33-length]].map(project);if(points.every(p=>p.visible)){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=this.ship.afterburner?'rgba(106,221,255,.84)':'rgba(250,172,74,.7)';ctx.fill();}}
            }
        },
        _draw: function(ctx, w, h) {
            this._updateView(w,h);
            ctx.save();
            let gShake = Math.min(10, Math.max(0, (this.ship.gForce - 6.0) * 1.5));
            if (gShake > 0) {
                ctx.translate((Math.random()-0.5)*gShake, (Math.random()-0.5)*gShake);
            }
            
            this._drawWorld(ctx,w,h);
            this._drawEntities(ctx,w,h);
            if(this.flightSchool)this._drawSchool(ctx,w,h);
            if(window.ArcadePlaySettings?.get().camera!=='cockpit')this._drawOwnPlane(ctx,w,h);
            this._drawHUD(ctx,w,h);
            if(window.ArcadePlaySettings?.get().camera==='cockpit')this._drawCockpit(ctx,w,h);
            ctx.restore();
            
            ctx.fillStyle='rgba(0,0,0,0.1)';
            // Native scene remains clear; no screen-wide scanline pass.
        },

        _drawHangar: function(ctx, w, h) {
            let sc = Math.min(1, w / 600); 
            
            ctx.fillStyle='rgba(10,15,20,0.95)'; ctx.fillRect(0,0,w,h);
            
            ctx.fillStyle='#e74c3c'; ctx.fillRect(20*sc, 20*sc, 100*sc, 40*sc);
            ctx.fillStyle='#fff'; ctx.font=`bold ${14*sc}px Arial`; ctx.textAlign='center'; ctx.fillText('SAIR', 70*sc, 45*sc);

            ctx.fillStyle='#00ffcc'; ctx.font=`bold ${40*sc}px "Russo One", Arial`; 
            ctx.fillText('HANGAR MILITAR', w/2, h*0.15,Math.max(160,w-35));
            ctx.fillStyle='#f1c40f'; ctx.font=`bold ${24*sc}px Arial`; 
            ctx.fillText("SALDO: "+new Intl.NumberFormat("pt-BR",{notation:"compact",maximumFractionDigits:1}).format(Math.max(0,Number(this.session.cash)||0))+" • RANK: "+this._getRank(), w/2, h*.25,Math.max(100,w-30));

            let drawCard = (cx, cy, title, desc, cost, level, color) => {
                ctx.fillStyle = this.session.cash >= cost ? color : '#333';
                ctx.fillRect(cx - 150*sc, cy - 30*sc, 300*sc, 60*sc);
                ctx.fillStyle = '#fff'; ctx.font=`bold ${16*sc}px Arial`;
                ctx.fillText(`${title} (LVL ${level}/5)`, cx, cy - 5*sc);
                ctx.font=`${12*sc}px Arial`; ctx.fillText(level>=5?'EVOLUÇÃO COMPLETA':`${desc} - R$ ${cost}`, cx, cy + 15*sc);
            };

            drawCard(w/2, h*0.37, "MOTOR TURBINADO", "Potência e Aceleração", 500 * this.upgrades.engine, this.upgrades.engine, '#2980b9');
            drawCard(w/2, h*0.55, "MÍSSEIS AVANÇADOS", "Dano + Recarga", 800 * this.upgrades.missiles, this.upgrades.missiles, '#c0392b');
            drawCard(w/2, h*0.73, "BLINDAGEM PESADA", "Aumenta Integridade", 1000 * this.upgrades.armor, this.upgrades.armor, '#27ae60');

            ctx.fillStyle='#2c3e50'; ctx.fillRect(w/2-200*sc, h*0.85, 400*sc, 60*sc);
            ctx.fillStyle='#fff'; ctx.font=`bold ${22*sc}px "Russo One", Arial`; 
            
            if (this.mode === 'SINGLE' || this.mode === 'FREE' || this.net.isHost) {
                ctx.fillText('TOQUE AQUI PARA VOAR', w/2, h*0.85+38*sc,Math.max(150,w-32));
            } else {
                ctx.fillText('AGUARDANDO LÍDER INICIAR...', w/2, h*0.85+38*sc,Math.max(150,w-32));
            }
        },

        _drawWorld: function(ctx,w,h) {
            let safeH = h > 0 ? h : 100;
            let hy = Math.sin(this.view?.pitch??this.ship.pitch??0) * safeH * 1.5;
            
            ctx.save();
            ctx.translate(w/2, safeH/2);
            ctx.rotate(-(this.view?.roll || 0));
            
            let skyY0 = -safeH * 4;
            let skyY1 = hy;
            if (Math.abs(skyY0 - skyY1) < 1) skyY1 = skyY0 + 1; 

            let sG = ctx.createLinearGradient(0, skyY0, 0, skyY1);
            sG.addColorStop(0,'#03121f');sG.addColorStop(.34,'#102e51');sG.addColorStop(.71,'#205680');sG.addColorStop(1,'#73a5b9');
            ctx.fillStyle = sG;
            ctx.fillRect(-w*3, -safeH*4, w*6, hy + safeH*4);
            
            let groundY0 = hy;
            let groundY1 = safeH * 4;
            if (Math.abs(groundY0 - groundY1) < 1) groundY1 = groundY0 + 1;

            let gG = ctx.createLinearGradient(0, groundY0, 0, groundY1);
            gG.addColorStop(0,'#779283');gG.addColorStop(.3,'#395c3f');gG.addColorStop(1,'#263f36');
            ctx.fillStyle = gG;
            ctx.fillRect(-w*3, hy, w*6, safeH*4);
            ctx.restore();

            let sunP = this._projectView(
                this.ship.x, this.ship.y + 50000, this.ship.z + 200000, 
                w,safeH);
            
            if (sunP.visible) {
                 ctx.fillStyle = "rgba(255, 255, 200, 0.9)";
                 ctx.shadowBlur = 60 * sunP.s; ctx.shadowColor = "#ffaa00";
                 ctx.beginPath(); ctx.arc(sunP.x, sunP.y, 10000 * sunP.s, 0, Math.PI*2); ctx.fill();
                 ctx.shadowBlur = 0;
            }

            this._drawTerrain(ctx,w,safeH);
        },
        _drawTerrain: function(ctx,w,h){
            const size=6000,cx=Math.floor(this.ship.x/size),cz=Math.floor(this.ship.z/size),range=window.ArcadePlaySettings?.get().quality==='low'?5:7;
            const palette=['#54784c','#63854f','#718b58','#8a9664','#5a8053','#66895e','#829b69','#597c61'];
            const cells=[];
            for(let x=cx-range;x<=cx+range;x++)for(let z=cz-range;z<=cz+range;z++){
                const seed=Math.abs((x*73856093)^(z*19349663)),points=[[x*size,0,z*size],[(x+1)*size,0,z*size],[(x+1)*size,0,(z+1)*size],[x*size,0,(z+1)*size]].map(v=>this._projectView(...v,w,h));
                if(points.every(p=>p.visible)&&points.some(p=>p.x>-w&&p.x<w*2&&p.y>-h&&p.y<h*2))cells.push({points,depth:points.reduce((n,p)=>n+p.z,0)/4,color:seed%19===0?'#527e89':palette[seed%palette.length]});
            }
            cells.sort((a,b)=>b.depth-a.depth);
            for(const cell of cells){ctx.beginPath();cell.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=cell.color;ctx.fill();ctx.fillStyle='rgba(173,196,188,'+Math.min(.72,cell.depth/140000)+')';ctx.fill();}
            const models=[];
            for(const s of this.scenery){
                const base=this._projectView(s.x,0,s.z,w,h);if(!base.visible||base.z>65000||base.x<-100||base.x>w+100)continue;
                if(s.kind==='forest'){
                    const v=[[s.x-s.w*.6,0,s.z],[s.x+s.w*.6,0,s.z],[s.x,s.h*1.6,s.z],[s.x,0,s.z-s.w*.6]],faces=[[0,1,2],[1,3,2],[3,0,2]];
                    for(let i=0;i<faces.length;i++){const points=faces[i].map(k=>this._projectView(...v[k],w,h));if(points.every(p=>p.visible))models.push({points,depth:base.z,color:['#365b42','#41664a','#294b39'][i]});}
                }else{
                    const v=[[-1,0,-1],[1,0,-1],[1,0,1],[-1,0,1],[-1,1,-1],[1,1,-1],[1,1,1],[-1,1,1]].map(([x,y,z])=>this._projectView(s.x+x*s.w*.5,y*s.h,s.z+z*s.w*.5,w,h));
                    for(const [indices,color]of [[[0,1,5,4],'#b6b49f'],[[1,2,6,5],'#8a968d'],[[2,3,7,6],'#9da696'],[[3,0,4,7],'#859184'],[[4,5,6,7],'#a46f52']]){const points=indices.map(i=>v[i]);if(points.every(p=>p.visible))models.push({points,depth:base.z,color});}
                }
            }
            models.sort((a,b)=>b.depth-a.depth);for(const model of models){ctx.beginPath();model.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=model.color;ctx.fill();}
        },

        _drawEntities: function(ctx,w,h) {
            let buf=[];
            const add=(list,t)=>list.forEach(o=>{
                let p=this._projectView(o.x,o.y,o.z,w,h);
                if(p.visible && Number.isFinite(p.x)) buf.push({p,t,o});
            });
            add(this.clouds,'c'); add(this.entities,'e'); add(this.bullets,'b'); add(this.missiles,'m'); add(this.fx,'f'); add(this.floaters,'x');
            
            if((this.mode==='PVP' || this.mode==='COOP') && this.net.players) {
                Object.keys(this.net.players).forEach(uid=>{
                    if(uid!==this.net.uid&&this.net.players[uid]?.hp>0){
                        let rp = this.net.players[uid];
                        let px = rp.x + (rp.vx||0)*0.05, py = rp.y + (rp.vy||0)*0.05, pz = rp.z + (rp.vz||0)*0.05; 
                        let p=this._projectView(px, py, pz, w,h);
                        if(p.visible && Number.isFinite(p.x)) buf.push({p,t:'p',o:rp,id:uid});
                    }
                });
            }
            buf.sort((a,b)=>b.p.z-a.p.z);
            buf.forEach(d=>{
                let p=d.p,s=p.s,o=d.o;
                if(d.t==='c'){ctx.save();ctx.translate(p.x,p.y);ctx.scale(1,.23);const radius=Math.max(1,o.size*s),g=ctx.createRadialGradient(0,0,0,0,0,radius);g.addColorStop(0,'rgba(244,251,255,.16)');g.addColorStop(1,'rgba(244,251,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();ctx.restore();}
                else if(d.t==='x'){ctx.fillStyle='#2ecc71';ctx.font=`bold ${Math.max(16,1500*s)}px 'Russo One'`;ctx.textAlign='center';ctx.fillText(o.text,p.x,p.y);}
                else if(d.t==='e'||d.t==='p'){
                    let isNet=d.t==='p';
                    Engine3D.drawJetModel(ctx, p.x, p.y, Math.max(0.1, s*2), o.roll||0, !isNet, isNet?(this.mode==='COOP'?'#00ffcc':'#ff3300'):(o.isBoss?'#f39c12':'#00ffcc'));
                    if(isNet){ctx.fillStyle=this.mode==='COOP'?'#00ffcc':'#ff3300';ctx.font='bold 14px Arial';ctx.textAlign='center';ctx.fillText(o.name||'ALIADO',p.x,p.y-300*s-10);}
                    
                    let dist = Math.hypot(o.x - this.ship.x, o.y - this.ship.y, o.z - this.ship.z);
                    const selected=this.combat.target&&(isNet?this.combat.target.uid===d.id:this.combat.target===o);
                    const locked=selected&&this.combat.locked;
                    
                    ctx.strokeStyle = locked ? '#ff0000' : (isNet && this.mode==='COOP' ? '#00ffcc' : '#ff9900');
                    ctx.lineWidth = locked ? 2 : 1;
                    ctx.strokeRect(p.x - 20, p.y - 20, 40, 40);
                    ctx.fillStyle = ctx.strokeStyle;
                    ctx.font = '10px "Russo One", Arial';
                    ctx.textAlign = 'center';
                    
                    ctx.fillText(Math.floor(dist) + 'm', p.x, p.y - 28);
                    ctx.fillText('ALT:' + Math.floor(o.y), p.x, p.y - 15);
                    if(selected&&!locked){ctx.strokeStyle='#ffdc79';ctx.beginPath();ctx.arc(p.x,p.y,27,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,this.combat.lockTimer/.65));ctx.stroke();ctx.fillText('TRAVANDO '+Math.floor(this.combat.lockTimer/.65*100)+'%',p.x,p.y+42);}

                    if(locked){
                        let bs = Math.max(40, 250*s); 
                        ctx.beginPath(); ctx.moveTo(p.x, p.y - bs); ctx.lineTo(p.x, p.y - bs - 20); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(p.x, p.y + bs); ctx.lineTo(p.x, p.y + bs + 20); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(p.x - bs, p.y); ctx.lineTo(p.x - bs - 20, p.y); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(p.x + bs, p.y); ctx.lineTo(p.x + bs + 20, p.y); ctx.stroke();
                        ctx.fillStyle='#ff0000';ctx.font='bold 14px Arial';ctx.textAlign='center';
                        ctx.fillText('MIRA TRAVADA',p.x,p.y+bs+35);
                    }
                }
                else if(d.t==='b'){ctx.globalCompositeOperation='lighter';ctx.fillStyle=o.isEnemy?'#ff0000':'#ffff00';ctx.beginPath();ctx.arc(p.x,p.y,Math.max(2,6*s),0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation='source-over';}
                else if(d.t==='m'){ctx.fillStyle=o.isEnemy?'#ff3300':'#ffffff';ctx.beginPath();ctx.arc(p.x,p.y,Math.max(2,6*s),0,Math.PI*2);ctx.fill();}
                else if(d.t==='f'){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.max(0,o.life);ctx.fillStyle=o.c;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(2,o.size*s),0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}
            });
        },
        
        _drawHUD: function(ctx,w,h){
            let p = this.ship;
            
            if (w <= 720 || h <= 500) {
                // Instrumentos compactos: visão do céu e do alvo livres no celular.
                ctx.save();
                const px=Math.min(110,Math.max(74,w*.22));
                const cardY=54,cardH=33,rightX=Math.min(w-px-8,w/2+8);
                ctx.fillStyle='rgba(3,15,28,.78)';
                if(ctx.roundRect){
                    ctx.beginPath();ctx.roundRect(8,cardY,px,cardH,8);ctx.fill();
                    ctx.beginPath();ctx.roundRect(rightX,cardY,px,cardH,8);ctx.fill();
                }else {ctx.fillRect(8,cardY,px,cardH);ctx.fillRect(rightX,cardY,px,cardH);}
                ctx.fillStyle='#8eeaff';ctx.font='bold 10px Arial';ctx.textAlign='center';
                ctx.fillText('VELOCIDADE',8+px/2,cardY+12);
                ctx.fillText('ALTITUDE',rightX+px/2,cardY+12);
                ctx.fillStyle='#f4ffff';ctx.font='bold 14px Arial';
                ctx.fillText(String(Math.max(0,Math.round(p.speed*3.6))),8+px/2,cardY+27);
                ctx.fillText(String(Math.round(p.y)),rightX+px/2,cardY+27);
                ctx.restore();
            } else {
            ctx.fillStyle='rgba(0,20,10,0.5)'; ctx.fillRect(10, h/2 - 120, 50, 240);
            ctx.fillStyle='#00ffcc'; ctx.font='bold 14px Arial'; ctx.textAlign='center';
            ctx.fillText("SPD", 35, h/2 - 130);
            for(let i=-4; i<=4; i++) {
                let val = Math.floor(p.speed*3.6) + (i*50);
                let yPos = h/2 - (i*25);
                ctx.fillRect(45, yPos, 15, 2);
                if(i===0) { ctx.fillStyle='#fff'; ctx.fillText(val, 25, yPos+4); ctx.fillStyle='#00ffcc'; }
            }
            ctx.beginPath(); ctx.moveTo(60, h/2); ctx.lineTo(70, h/2-8); ctx.lineTo(70, h/2+8); ctx.fill();

            ctx.fillStyle='rgba(0,20,10,0.5)'; ctx.fillRect(w-60, h/2 - 120, 50, 240);
            ctx.fillStyle='#00ffcc'; ctx.fillText("ALT", w-35, h/2 - 130);
            for(let i=-4; i<=4; i++) {
                let val = Math.floor(p.y) + (i*100);
                let yPos = h/2 - (i*25);
                ctx.fillRect(w-60, yPos, 15, 2);
                if(i===0) { ctx.fillStyle='#fff'; ctx.fillText(val, w-25, yPos+4); ctx.fillStyle='#00ffcc'; }
            }
            ctx.beginPath(); ctx.moveTo(w-60, h/2); ctx.lineTo(w-70, h/2-8); ctx.lineTo(w-70, h/2+8); ctx.fill();

            }

            ctx.save();ctx.fillStyle='#b5e5ff';ctx.font='bold 11px Arial';ctx.textAlign='center';ctx.fillText('POTÊNCIA '+Math.round(this.pilot.throttle*100)+'%',w/2,h-28);ctx.restore();
            let hdg=(p.yaw*180/Math.PI)%360;if(hdg<0)hdg+=360;
            ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(0,0,w,50);
            ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='bold 22px "Russo One", Arial';ctx.fillText(Math.floor(hdg)+'°',w/2,35);
            
            const aim=this._projectView(p.x+Math.sin(p.yaw)*Math.cos(p.pitch)*4000,p.y+Math.sin(p.pitch)*4000,p.z+Math.cos(p.yaw)*Math.cos(p.pitch)*4000,w,h);
            ctx.save();if(aim.visible)ctx.translate(aim.x-w/2,aim.y-h/2);
            ctx.strokeStyle='#00ffcc'; ctx.lineWidth=2;
            ctx.beginPath(); ctx.arc(w/2, h/2, 4, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(w/2, h/2, 20, 0, Math.PI*2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(w/2 - 40, h/2); ctx.lineTo(w/2 - 20, h/2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(w/2 + 40, h/2); ctx.lineTo(w/2 + 20, h/2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(w/2, h/2 - 40); ctx.lineTo(w/2, h/2 - 20); ctx.stroke();

            ctx.restore();
            if (this.combat.target) {
                let distToTarget = Math.hypot(this.combat.target.x - p.x, this.combat.target.y - p.y, this.combat.target.z - p.z);
                let spd = p.speed + 1200;
                let leadTime = distToTarget / spd;
                let tX = this.combat.target.x + (this.combat.target.vx || 0) * leadTime;
                let tY = this.combat.target.y + (this.combat.target.vy || 0) * leadTime;
                let tZ = this.combat.target.z + (this.combat.target.vz || 0) * leadTime;
                let leadP = this._projectView(tX, tY, tZ, w,h);
                if (leadP.visible) {
                    ctx.strokeStyle = 'rgba(255, 200, 0, 0.5)';
                    ctx.beginPath(); ctx.arc(leadP.x, leadP.y, 10, 0, Math.PI*2); ctx.stroke();
                }
            }

            let vDirX = p.vx/p.speed, vDirY = p.vy/p.speed, vDirZ = p.vz/p.speed;
            let vP = this._projectView(p.x + vDirX*1000, p.y + vDirY*1000, p.z + vDirZ*1000, w,h);
            if (vP.visible) {
                ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
                ctx.beginPath(); ctx.arc(vP.x, vP.y, 5, 0, Math.PI*2); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(vP.x-10, vP.y); ctx.lineTo(vP.x-5, vP.y); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(vP.x+10, vP.y); ctx.lineTo(vP.x+5, vP.y); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(vP.x, vP.y-10); ctx.lineTo(vP.x, vP.y-5); ctx.stroke();
            }

            if(w>720&&h>500){
            ctx.textAlign='left'; ctx.font='bold 14px Arial'; ctx.fillStyle='#00ffcc';
            ctx.fillText(`FORÇA G: ${p.gForce.toFixed(1)}G`, 20, 80);
            ctx.fillText(`MACH: ${p.mach.toFixed(2)}`, 20, 100);
            ctx.fillText(`AoA: ${(p.alpha * 180/Math.PI).toFixed(1)}°`, 20, 120);
            
            }
            if (p.afterburner) {
                ctx.fillStyle='#ff9900';
                ctx.fillText(`AQUECIMENTO: ${Math.floor(p.engineHeat)}%`, 20, 140);
            }

            if (p.mach > 2.2) {
                ctx.fillStyle='#ff0000'; ctx.font='bold '+Math.min(18,Math.max(11,w*.031))+'px Arial'; ctx.textAlign='center';
                ctx.fillText("VELOCIDADE CRÍTICA", w/2, Math.max(68,h*.14),Math.max(90,w-30));
            } else if (p.isStalling) {
                ctx.fillStyle = (Math.floor(performance.now() / 150) % 2 === 0) ? "#ff0000" : "#fff"; 
                ctx.textAlign = "center"; ctx.font = "bold "+Math.min(18,Math.max(10,w*.029))+"px Arial"; ctx.fillText("ESTOL • BAIXE O BICO", w/2, Math.max(85,h*.18),Math.max(100,w-30)); 
            }

            const compact=w<=720||h<=500,rr=compact?36:65,rx=compact?46:w-82,ry=compact?140:220;
            ctx.fillStyle='rgba(0,30,10,0.85)'; ctx.beginPath(); ctx.arc(rx,ry,rr,0,Math.PI*2); ctx.fill();
            ctx.strokeStyle='rgba(0,255,204,0.3)'; ctx.lineWidth=1;
            ctx.beginPath(); ctx.arc(rx,ry,rr*0.5,0,Math.PI*2); ctx.stroke();
            ctx.beginPath(); ctx.arc(rx,ry,rr,0,Math.PI*2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(rx,ry-rr); ctx.lineTo(rx,ry+rr); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(rx-rr,ry); ctx.lineTo(rx+rr,ry); ctx.stroke();
            
            ctx.beginPath(); ctx.moveTo(rx,ry); ctx.lineTo(rx-rr*0.6, ry-rr*0.8); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(rx,ry); ctx.lineTo(rx+rr*0.6, ry-rr*0.8); ctx.stroke();

            ctx.fillStyle='#fff'; ctx.beginPath(); ctx.moveTo(rx,ry-6); ctx.lineTo(rx-5,ry+4); ctx.lineTo(rx+5,ry+4); ctx.fill();
            
            const RADAR_RANGE = 40000;
            const plot=(tx, ty, tz, col, isTarget)=>{
                let dx = tx - p.x, dy = ty - p.y, dz = tz - p.z;
                let cr = Math.cos(p.yaw), sr = Math.sin(p.yaw);
                let lx = dx*cr - dz*sr;
                let lz = dx*sr + dz*cr;
                let d = Math.hypot(lx, lz);
                
                if(d < RADAR_RANGE) {
                    let px = rx + (lx/RADAR_RANGE)*rr;
                    let py = ry - (lz/RADAR_RANGE)*rr;
                    
                    ctx.fillStyle=col; 
                    ctx.beginPath();
                    
                    if (dy > 500) { 
                        ctx.moveTo(px, py - 6); ctx.lineTo(px - 5, py + 4); ctx.lineTo(px + 5, py + 4); 
                        ctx.fill(); 
                    } else if (dy < -500) { 
                        ctx.moveTo(px, py + 6); ctx.lineTo(px - 5, py - 4); ctx.lineTo(px + 5, py - 4); 
                        ctx.fill(); 
                    } else {
                        ctx.arc(px, py, 4, 0, Math.PI*2); 
                        ctx.fill(); 
                    }
                    
                    if (isTarget) {
                        ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 1;
                        ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI*2); ctx.stroke();
                    }
                }
            };

            this.entities.forEach(e => plot(e.x, e.y, e.z, e.isBoss?'#ff9900':'#ff0000', this.combat.target === e));
            if((this.mode==='PVP' || this.mode==='COOP') && this.net.players) {
                Object.keys(this.net.players).forEach(uid => {
                    if(uid!==this.net.uid && this.net.players[uid]?.hp>0) {
                        plot(this.net.players[uid].x, this.net.players[uid].y, this.net.players[uid].z, this.mode==='COOP'?'#00ffff':'#ff0000', false);
                    }
                });
            }
        },

        _drawCockpit: function(ctx,w,h){
            let cx=w/2,cy=h/2;
            
            if(this.pilot.active){
                ctx.save();
                let yokeYOffset = 0;
                if (this.pilot.targetPitch < -0.2) yokeYOffset = 40; 
                else if (this.pilot.targetPitch > 0.2) yokeYOffset = -40; 
                
                let sc = Math.min(1, w/600); 
                ctx.translate(cx, h + yokeYOffset + 20); 
                ctx.scale(sc, sc);
                
                ctx.fillStyle='#050a10';ctx.fillRect(-30,-180,60,180);
                ctx.translate(0,-160);ctx.rotate(this.pilot.targetRoll);
                
                ctx.shadowBlur = 10; ctx.shadowColor = "#000";
                ctx.fillStyle='#1a202c'; ctx.strokeStyle='#00ffcc'; ctx.lineWidth=3; ctx.lineJoin='round';
                
                ctx.beginPath();
                ctx.moveTo(-130, -20);
                ctx.lineTo(-150, 60);
                ctx.lineTo(-80, 80);
                ctx.lineTo(80, 80);
                ctx.lineTo(150, 60);
                ctx.lineTo(130, -20);
                ctx.lineTo(70, -20);
                ctx.lineTo(70, 30);
                ctx.lineTo(-70, 30);
                ctx.lineTo(-70, -20);
                ctx.closePath();
                ctx.fill(); ctx.stroke();
                
                ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(-110, 0, 20, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(110, 0, 20, 0, Math.PI*2); ctx.fill();

                ctx.fillStyle = this.combat.missileCd <= 0 ? '#ff3300' : '#440000'; 
                ctx.beginPath(); ctx.arc(-110, 0, 10, 0, Math.PI*2); ctx.fill();

                ctx.fillStyle='#ffcc00'; ctx.beginPath(); ctx.arc(110, 0, 10, 0, Math.PI*2); ctx.fill();
                
                if (this.combat.target) {
                    if (this.combat.locked) {
                        ctx.fillStyle = "#ffcf68"; ctx.font = "bold "+Math.min(16,Math.max(10,w*.029))+"px Arial"; ctx.textAlign = "center";
                        ctx.fillText(window.ArcadeControls?.mode==="controls"?"SEGURE ATIRAR • ◎ MÍSSIL":"JUNTE AS MÃOS PARA ATIRAR!",0,-50,Math.max(95,w*.62));
                    } else {
                        ctx.fillStyle = "#ffcc00"; ctx.font = "bold 16px Arial"; ctx.textAlign = "center";
                        ctx.fillText("TRAVANDO MIRA...",0,-50,Math.max(95,w*.62));
                    }
                }

                ctx.restore();
            } else {
                ctx.fillStyle='#ff0000';ctx.textAlign='center';ctx.font='bold '+Math.min(17,Math.max(10,w*.028))+'px Arial';ctx.fillText(window.ArcadeControls?.mode==="controls"?"JOYSTICK OU SETAS PARA PILOTAR":"SEGURE O VOLANTE COM AS DUAS MÃOS",cx,h-100,Math.max(95,w-30));
            }

            ctx.fillStyle='rgba(0,15,10,0.8)';ctx.fillRect(0,h-50,w,50);
            ctx.fillStyle='#222';ctx.fillRect(20,h-30,w/2 - 40,12);
            ctx.fillStyle=this.ship.hp>30?'#00ffcc':'#ff3300';
            ctx.fillRect(20,h-30,(w/2 - 40)*(Math.max(0,this.ship.hp)/this.ship.maxHp),12);
            ctx.fillStyle='#fff';ctx.font='bold 14px Arial';ctx.textAlign='left';ctx.fillText(`INTEGRIDADE: ${Math.floor(this.ship.hp)} / ${this.ship.maxHp}`,20,h-35);
            ctx.fillStyle='#f1c40f';ctx.font='bold 22px "Russo One", Arial';ctx.textAlign='right';
            
            let coOpText = (this.mode === 'COOP') ? ` | ABATES TIME: ${this.net.sharedData?.teamKills||this.session.kills}` : '';
            ctx.fillText(`R$ ${this.session.cash}${coOpText}`,w-20,h-20);
        },
        
        _drawLobby: function(ctx,w,h){
            let sc = Math.min(1, w / 600); 
            
            ctx.fillStyle='rgba(10,20,10,0.95)';ctx.fillRect(0,0,w,h);
            
            ctx.fillStyle='#e74c3c'; ctx.fillRect(20*sc, 20*sc, 100*sc, 40*sc);
            ctx.fillStyle='#fff'; ctx.font=`bold ${14*sc}px Arial`; ctx.textAlign='center'; ctx.fillText('SAIR', 70*sc, 45*sc);

            if (this.mode === 'PVP' || this.mode === 'COOP') {
                ctx.fillStyle='#f39c12'; ctx.fillRect(w - 180*sc, 20*sc, 160*sc, 40*sc);
                ctx.fillStyle='#fff'; ctx.font=`bold ${14*sc}px Arial`; ctx.textAlign='center'; ctx.fillText('🛠️ ASSUMIR LÍDER', w - 100*sc, 45*sc);
            }

            ctx.fillStyle='#00ffcc'; ctx.font=`bold ${40*sc}px "Russo One", Arial`;ctx.fillText('SALA DE REUNIÃO TÁTICA',w/2,h*0.15);
            const ps=Object.keys(this.net.players);
            ctx.font=`bold ${24*sc}px Arial`;ctx.fillStyle='#fff';ctx.fillText(`PILOTOS CONECTADOS: ${ps.length}`,w/2,h*0.25);
            let py=h*0.35;
            ps.forEach(uid=>{
                let p = this.net.players[uid];
                ctx.fillStyle=p.ready?'#2ecc71':'#e74c3c';ctx.fillText(`[${p.ready?'PRONTO':'AGUARDANDO'}] ${p.name}`,w/2,py);py+=40*sc;
            });
            
            if(this.net.isHost){
                const r=ps.length>=1;
                ctx.fillStyle=r?'#c00':'#333';ctx.fillRect(w/2-250*sc,h*0.85,500*sc,60*sc);
                ctx.fillStyle='#fff';ctx.font=`bold ${22*sc}px "Russo One", Arial`;ctx.fillText(r?'TOQUE NA TELA PARA INICIAR A MISSÃO':'AGUARDANDO...',w/2,h*0.85+38*sc);
            }else{
                let isR = this.net.players[this.net.uid]?.ready;
                ctx.fillStyle=isR?'#e83':'#27a';ctx.fillRect(w/2-250*sc,h*0.85,500*sc,60*sc);
                ctx.fillStyle='#fff';ctx.font=`bold ${22*sc}px "Russo One", Arial`;ctx.fillText(isR?'AGUARDANDO O LÍDER INICIAR':'TOQUE NA TELA: CONFIRMAR PRESENÇA',w/2,h*0.85+38*sc);
            }
        },

        _drawCalib: function(ctx,w,h){
            let sc = Math.min(1, w / 600); 
            
            ctx.fillStyle='rgba(0,10,15,0.95)';ctx.fillRect(0,0,w,h);
            ctx.strokeStyle='rgba(0,255,204,0.2)';ctx.lineWidth=2;ctx.strokeRect(50*sc,50*sc,w-100*sc,h-100*sc);
            ctx.fillStyle='#00ffcc';ctx.textAlign='center';ctx.font=`bold ${30*sc}px "Russo One", Arial`;ctx.fillText('CALIBRAÇÃO DE VOO',w/2,h*0.3);
            ctx.fillStyle='#fff';ctx.font=`bold ${20*sc}px Arial`;ctx.fillText(window.ArcadeControls?.mode==='controls'?'JOYSTICK À ESQUERDA • INICIAR PARA VOAR.':'POSICIONE AS DUAS MÃOS FRENTE À CÂMERA.',w/2,h*0.4,Math.max(130,w-28));
            ctx.fillStyle='#f1c40f';ctx.font=`bold ${16*sc}px Arial`;ctx.fillText(window.ArcadeControls?.mode==='controls'?'ARRASTE NA DIAGONAL PARA CURVAR E SUBIR.':'GIRE COMO UM VOLANTE PARA CURVAR. PUXE PARA SUBIR.',w/2,h*0.48,Math.max(130,w-28));
            ctx.fillStyle='#ff5555';ctx.font=`bold ${16*sc}px Arial`;ctx.fillText(window.ArcadeControls?.mode==='controls'?'ATIRAR COM TRAVA • ◎ MÍSSIL • ⚡ TURBO':'JUNTE AS MÃOS PARA ATIRAR MÍSSEIS.',w/2,h*0.53,Math.max(130,w-28));
            
            let pct=1-(this.timer/5.0);
            ctx.fillStyle='#111';ctx.fillRect(w/2-200*sc,h*0.65,400*sc,15*sc);
            
            if (this.pilot.active) {
                ctx.fillStyle='#00ffcc';ctx.fillRect(w/2-200*sc,h*0.65,400*sc*pct,15*sc);
                ctx.fillText(`MANTENHA A POSIÇÃO (${Math.ceil(this.timer)}s)`, w/2, h*0.75);
            } else {
                ctx.fillStyle='#ff0000';
                ctx.fillText(window.ArcadeControls?.mode==='controls'?'CONFIRA OS COMANDOS E TOQUE EM INICIAR':'AGUARDANDO MÃOS NA CÂMERA...', w/2, h*0.75,Math.max(130,w-28));
            }
        },

        _drawEnd: function(ctx,w,h){
            this._draw(ctx,w,h);
            ctx.fillStyle='rgba(0,0,0,0.85)';ctx.fillRect(0,0,w,h);
            ctx.textAlign='center';ctx.font='bold '+Math.min(29,Math.max(17,w*.055))+'px Arial';
            ctx.fillStyle=this.state==='VICTORY'?'#2ecc71':'#ff0000';
            ctx.fillText(this.state==='VICTORY'?'MISSÃO CUMPRIDA!':'CAÇA ABATIDO',w/2,h/2,Math.max(100,w-28));
            ctx.fillStyle='#f1c40f';ctx.font='bold '+Math.min(18,Math.max(11,w*.03))+'px Arial';
            ctx.fillText("SALDO: "+new Intl.NumberFormat("pt-BR",{notation:"compact",maximumFractionDigits:1}).format(Math.max(0,Number(this.session.cash)||0)),w/2,h/2+52,Math.max(100,w-30));
        }
    };

    const register = () => {
        if (window.System && window.System.registerGame) {
            window.System.registerGame('usarmy_flight_sim', 'Aero Strike WAR', '✈️', Game, {
                camera: 'user', camOpacity: 0.2,
                phases: [
                    { id: 'training', name: 'CAMPANHA SOLO', desc: 'Destrua as ameaças e evolua o seu caça.', mode: 'SINGLE', reqLvl: 1 },
                    { id: 'free', name: 'VOO LIVRE', desc: 'Explore o cenário e treine manobras.', mode: 'FREE', reqLvl: 1 },
                    { id: 'flight-school', name: 'ESCOLA DE VOO', desc: 'Decole, atravesse cinco arcos e pratique a aproximação e o pouso.', mode: 'FREE', school:true, reqLvl: 1 },
                    { id: 'coop', name: 'CO-OP ESQUADRÃO', desc: 'Junte-se a aliados para abater o ACE.', mode: 'COOP', reqLvl: 1 },
                    { id: 'pvp', name: 'COMBATE PVP', desc: 'Batalha aérea multijogador.', mode: 'PVP', reqLvl: 1 }
                ]
            });
            return true;
        }
        return false;
    };

    if (!register()) {
        const check = setInterval(() => { if (register()) clearInterval(check); }, 100);
    }
})();
