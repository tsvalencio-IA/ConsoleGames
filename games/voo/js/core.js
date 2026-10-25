/* =================================================================
   CORE DO SISTEMA - VERSÃO COM LOGIN E INTEGRAÇÃO FIREBASE DB
   STATUS: GESTÃO DE SESSÃO E PERMISSÕES DE JOGOS ATIVADAS
   ================================================================= */

window.Sfx = {
    ctx: null,
    init: () => { 
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        if(!window.AudioContext)return;
        if (!window.Sfx.ctx || window.Sfx.ctx.state === 'closed') window.Sfx.ctx = window.GameAudio?.context() || new AudioContext();
        if (window.Sfx.ctx.state !== 'running') window.Sfx.ctx.resume().catch(()=>{});
    },
    play: (f, t, d, v=0.1) => {
        if(!window.Sfx.ctx || window.Sfx.ctx.state !== 'running') window.Sfx.init();
        if(!window.Sfx.ctx) return;
        try {
            if(t==='noise'){
                const c=window.Sfx.ctx,length=Math.max(.015,Math.min(.3,d)),buf=c.createBuffer(1,Math.ceil(c.sampleRate*length),c.sampleRate),data=buf.getChannelData(0);
                for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,2);
                const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();source.buffer=buf;filter.type='lowpass';filter.frequency.value=Math.max(350,f*4);gain.gain.value=v*(window.ArcadePlaySettings?.get().effectsVolume??1);source.connect(filter);filter.connect(gain);gain.connect(c.destination);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};source.start();return;
            }
            const o = window.Sfx.ctx.createOscillator(); const g = window.Sfx.ctx.createGain();
            o.type=t; o.frequency.value=f; 
            g.gain.setValueAtTime(Math.max(.00001,v*(window.ArcadePlaySettings?.get().effectsVolume??1)), window.Sfx.ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.00001, window.Sfx.ctx.currentTime+d);
            o.connect(g); g.connect(window.Sfx.ctx.destination); 
            o.onended=()=>{o.disconnect();g.disconnect();};o.start(); o.stop(window.Sfx.ctx.currentTime+d);
        } catch(e){}
    },
    hover: () => window.Sfx.play(800, 'sine', 0.05, 0.04),
    click: () => window.Sfx.play(1000, 'sine', 0.1, 0.08),
    error: () => window.Sfx.play(150, 'sawtooth', 0.3, 0.1),
    coin: () => { window.Sfx.play(988, 'sine', 0.1, 0.1); setTimeout(()=>window.Sfx.play(1319, 'sine', 0.2, 0.1), 100); },
    epic: () => { window.Sfx.play(400, 'square', 0.5, 0.2); setTimeout(()=>window.Sfx.play(600, 'sawtooth', 0.5, 0.2), 200); setTimeout(()=>window.Sfx.play(800, 'sine', 1.0, 0.3), 400); }
};

window.Gfx = {
    shake: 0,
    addShake: (val) => { window.Gfx.shake = Math.min(window.Gfx.shake + val, 30); },
    updateShake: (ctx) => {
        if(window.Gfx.shake > 0.5) {
            ctx.translate((Math.random()-0.5)*window.Gfx.shake, (Math.random()-0.5)*window.Gfx.shake);
            window.Gfx.shake *= 0.85;
        } else window.Gfx.shake = 0;
    },
    shakeScreen: (val) => { window.Gfx.addShake(val); }
};

window.Auth = {
    getFakeEmail: (username) => {
        return username.trim().toLowerCase().replace(/\s+/g, '') + '@thiaguinho.os';
    },
    
    showError: (msg) => {
        const errEl = document.getElementById('auth-error');
        errEl.innerText = msg;
        errEl.style.display = 'block';
        window.Sfx.error();
    },

    login: async () => {
        window.Sfx.click();
        const user = document.getElementById('auth-user').value;
        const pass = document.getElementById('auth-pass').value;
        if(!user || !pass) return window.Auth.showError("Preenche nome e senha!");
        
        try {
            document.getElementById('loading').classList.remove('hidden');
            const access=window.GameAccountAccess?.capture(document.getElementById('auth-form'));
            await access?.prepare(window.AuthApp);
            await window.AuthApp.signInWithEmailAndPassword(window.Auth.getFakeEmail(user), pass);
            access?.complete();
        } catch(e) {
            document.getElementById('loading').classList.add('hidden');
            window.Auth.showError("Credenciais inválidas. Tenta de novo!");
        }
    },

    register: async () => {
        window.Sfx.click();
        const user = document.getElementById('auth-user').value.trim();
        const pass = document.getElementById('auth-pass').value;
        if(!user || pass.length < 6) return window.Auth.showError("O nome não pode estar vazio e a senha deve ter 6 dígitos!");
        
        try {
            document.getElementById('loading').classList.remove('hidden');
            const access=window.GameAccountAccess?.capture(document.getElementById('auth-form'));
            await access?.prepare(window.AuthApp);
            const cred = await window.AuthApp.createUserWithEmailAndPassword(window.Auth.getFakeEmail(user), pass);
            
            const role = 'player'; // Novas contas não recebem privilégios por nome escolhido.
            
            const initialProfile = {
                username: user,
                role: role,
                xp: 0,
                level: 1,
                coins: 0,
                permissions: {}
            };
            
            if(window.Games) {
                (window.Games || []).forEach(g => {
                    initialProfile.permissions[g.id] = (role === 'admin' || g.id === 'drive'); 
                });
            }

            await window.DB.ref('users/' + cred.user.uid).set(initialProfile);
            access?.complete();
        } catch(e) {
            document.getElementById('loading').classList.add('hidden');
            window.Auth.showError("Nome já existe ou ocorreu um erro.");
        }
    },

    logout: () => {
        if(window.ConsolePractice?.active){window.ConsolePractice.leave();return;}
        window.Sfx.click();
        window.AuthApp.signOut();
    }
};

window.Profile = {
    username: 'Jogador', role: 'player', xp: 0, level: 1, coins: 0, permissions: {},
    
    flightSave:null,
    // Suporte aos Dados do Jogo de AR
    arSave: { 
        upgrades: { engine: 1, battery: 1, radar: 1, chassis: 1, scout: false } 
    },

    loadFromFirebase: (uid) => {
        return new Promise((resolve) => {
            if(window.ConsolePractice?.active||!window.DB){resolve();return;}
            window.DB.ref('users/' + uid).on('value', snap => {
                if(window.ConsolePractice?.active){resolve();return;}
                const data = snap.val();
                if(data) {
                    window.Profile.username = data.username || 'Jogador';
                    window.Profile.role = data.role || 'player';
                    window.Profile.xp = data.xp || 0;
                    window.Profile.level = data.level || 1;
                    window.Profile.coins = data.coins || 0;
                    window.Profile.permissions = data.permissions || {};
                    if(data.arSave) window.Profile.arSave = data.arSave;
                    window.Profile.flightSave=data.flightSave||null;
                    window.Profile.updateUI();
                    window.System.renderChannels(); 
                }
                resolve();
            });
        });
    },

    save: () => {
        if(window.ConsolePractice?.active){window.ConsolePractice.save();return;}
        if(window.System.playerId && window.System.playerId.length > 20) {
            window.DB.ref('users/' + window.System.playerId).update({
                xp: window.Profile.xp,
                level: window.Profile.level,
                coins: window.Profile.coins,
                arSave:window.Profile.arSave,flightSave:window.Profile.flightSave||null
            });
        }
        window.Profile.updateUI(); 
    },

    // Função que o game_ar.js vai chamar para gastar/ganhar dinheiro
    saveAR: (arMoney, arUpgrades) => {
        window.Profile.coins = arMoney;
        window.Profile.arSave.upgrades = arUpgrades;
        window.Profile.save();
    },

    addReward: (score, isWin, extraCoins = 0) => {
        // Validate a single match, not historical balances. Original Firebase data
        // is never zeroed or automatically reconciled.
        const scoreNumber=Number(score);
        const amount=Number(extraCoins);
        const safeScore=Number.isFinite(scoreNumber)?Math.min(100000,Math.max(0,Math.floor(scoreNumber))):0;
        const safeExtra=Number.isFinite(amount)?Math.min(20000,Math.max(0,Math.floor(amount))):0;
        let xpGained = isWin ? Math.max(100, Math.floor(safeScore * 2.0)) : Math.max(20, Math.floor(safeScore * 0.5));
        let coinsGained = (isWin ? Math.max(10, Math.floor(safeScore * 0.2)) : 0) + safeExtra;
        const currentXp=Number(window.Profile.xp);
        if(Number.isSafeInteger(currentXp)&&currentXp>=0){
            window.Profile.xp=currentXp+xpGained;
        }else{xpGained=0;console.warn("XP de perfil anormal: valor original preservado.");}
        const currentCoins=Number(window.Profile.coins);
        if(Number.isSafeInteger(currentCoins)&&currentCoins>=0&&currentCoins<=Number.MAX_SAFE_INTEGER-coinsGained){
            window.Profile.coins=currentCoins+coinsGained;
        }else{coinsGained=0;console.warn("Saldo de perfil anormal: valor original preservado.");}
        
        let nextLevelXP = window.Profile.level * 1000; let leveledUp = false;
        // Never lock a mobile game if a legacy XP record is abnormally large.
        let levelSafety=0;
        while(window.Profile.xp >= nextLevelXP && levelSafety++<100) {
            window.Profile.level++; window.Profile.xp -= nextLevelXP; nextLevelXP = window.Profile.level * 1000; leveledUp = true;
        }
        window.Profile.save(); return { xp: xpGained, coins: coinsGained, leveledUp };
    },

    updateUI: () => {
        const reqXP = window.Profile.level * 1000; const pct = Math.min(100, (window.Profile.xp / reqXP) * 100);
        const nameEl = document.getElementById('ui-username'); if(nameEl) nameEl.innerText = window.Profile.username;
        document.getElementById('ui-level').innerText = window.Profile.level;
        document.getElementById('ui-xp-text').innerText = `${window.Profile.xp}/${reqXP}`;
        document.getElementById('ui-xp-bar').style.width = `${pct}%`;
        const wallet=Number(window.Profile.coins);
        const walletLabel=Number.isSafeInteger(wallet)&&wallet>=0&&wallet<1e9
            ? new Intl.NumberFormat("pt-BR",{notation:"compact",maximumFractionDigits:1}).format(wallet)
            : "CONFERIR SALDO";
        document.getElementById('ui-coins').innerText=walletLabel;

        const adminBtnContainer = document.getElementById('admin-btn-container');
        if (adminBtnContainer) {
            if (window.Profile.role === 'admin') {
                adminBtnContainer.innerHTML = `<div class="wii-oval-btn" onclick="window.Admin.init()" style="border-color:#e67e22; color:#e67e22;">Painel Admin</div>`;
            } else {
                adminBtnContainer.innerHTML = '';
            }
        }
    },

    getRank: (score, isWin) => {
        if(!isWin) return { rank: 'D', color: '#95a5a6', msg: "FALHOU" };
        if(score > 3000) return { rank: 'S', color: '#f1c40f', msg: "LENDÁRIO!" };
        if(score > 1500) return { rank: 'A', color: '#e74c3c', msg: "EXCELENTE!" };
        if(score > 800)  return { rank: 'B', color: '#3498db', msg: "MUITO BOM" };
        return { rank: 'C', color: '#2ecc71', msg: "SUCESSO" };
    }
};

window.System = {
    playerId: 'p_' + Math.floor(Math.random()*10000), 
    activeGame: null, loopId: null, loopEpoch: 0, busyEpoch: null, resultLocked: false, isStarting: false,
    canvas: null, video: null, detector: null,
    currentCameraMode: null,

    switchCamera: async (facingMode) => {
        if (window.System.currentCameraMode === facingMode && window.System.video?.srcObject?.active) return true;
        if (!navigator.mediaDevices?.getUserMedia || !window.System.video) return false;
        if (window.System.video.srcObject) {
            window.System.video.srcObject.getTracks().forEach(track => track.stop());
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: facingMode }, width: 640, height: 480 },
                audio: false
            });
            window.System.video.srcObject = stream;
            
            if (facingMode === 'environment') {
                window.System.video.style.transform = "none";
            } else {
                window.System.video.style.transform = "scaleX(-1)";
            }
            
            await Promise.race([new Promise(resolve => { window.System.video.onloadedmetadata = resolve; }), new Promise(resolve => setTimeout(resolve,3500))]);
            window.System.currentCameraMode = facingMode;
            return true;
        } catch(error) {
            console.warn("Câmera indisponível (modo por toque pode continuar):", error);
            window.System.currentCameraMode=null;
            return false;
        }
    },

    registerGame: (id, title, icon, logic, opts={}) => {
        if(!window.Games) window.Games = [];
        const existing = window.Games.findIndex(g => g.id === id);
        if(existing >= 0) window.Games[existing] = {id, title, icon, logic, opts};
        else window.Games.push({id, title, icon, logic, opts});
        window.System.renderChannels();
    },

    renderChannels: () => {
        const grid = document.getElementById('channel-grid');
        if(!grid || !Array.isArray(window.Games)) return;
        grid.innerHTML = '';
        window.Games.forEach(g => {
            const hasAccess = window.Profile.role === 'admin' || window.Profile.permissions[g.id] === true;
            if (hasAccess) {
                const div = document.createElement('div'); div.className = 'channel';
                div.innerHTML = `<div class="channel-icon">${g.icon}</div><div class="channel-title">${g.title}</div>`;
                div.onclick = () => { window.Sfx.click(); window.System.openPhases(g); };
                div.onmouseenter = () => window.Sfx.hover(); grid.appendChild(div);
            }
        });
    },

    openPhases: (game) => {
        document.getElementById('menu-screen').classList.add('hidden');
        document.getElementById('phase-screen').classList.remove('hidden');
        document.getElementById('phase-title').innerText = game.title.toUpperCase();
        
        const grid = document.getElementById('phase-grid'); grid.innerHTML = '';
        const phases = game.opts.phases || [ { id: 'arcade', name: 'MODO ARCADE', desc: 'Jogue livremente offline ou online', reqLvl: 1 } ];

        phases.forEach(fase => {
            const isUnlocked = window.Profile.level >= fase.reqLvl;
            const card = document.createElement('div');
            card.className = `mission-card ${isUnlocked ? '' : 'locked'}`;
            card.innerHTML = `
                <div class="mission-info">
                    <h2>${fase.name}</h2>
                    <p>${fase.desc}</p>
                </div>
                <div class="mission-icon">${isUnlocked ? '⭐' : '🔒'}</div>
            `;
            
            if(isUnlocked) {
                card.onclick = async () => {
                    const sys=window.System;
                    if(sys.isStarting || sys.activeGame)return;
                    sys.isStarting=true;
                    window.Sfx.init();window.GameAudio?.unlock();window.Sfx.click();
                    // Explicit opt-in: touch/keyboard (default) or live camera.
                    const requested = window.ArcadeControls ? await window.ArcadeControls.choose(game) : 'controls';
                    if(!requested) {sys.isStarting=false;return;}
                    window.ArcadeControls?.setMode(requested);
                    document.getElementById('phase-screen').classList.add('hidden');
                    document.getElementById('loading').classList.remove('hidden');
                    document.getElementById('loading-text').innerText='PREPARANDO PARTIDA...';
                    try {
                        if(window.ArcadeControls?.mode==='camera'){
                            const face=game.opts.camera==='environment'?'environment':'user';
                            const started=await sys.switchCamera(face);
                            if(!started){
                                window.ArcadeControls?.setMode('controls');
                                window.System.msg('CÂMERA INDISPONÍVEL • CONTROLES ATIVADOS');
                            }else if(face==='user' && sys.ensureDetector){
                                const detector=await sys.ensureDetector();
                                if(!detector){
                                    window.ArcadeControls?.setMode('controls');
                                    window.System.msg('SENSOR INDISPONÍVEL • CONTROLES ATIVADOS');
                                    sys.video.srcObject?.getTracks?.().forEach(t=>t.stop());
                                    sys.video.srcObject=null;sys.currentCameraMode=null;
                                }
                            }
                        }
                        document.getElementById('loading-text').innerText='CARREGANDO CENÁRIO...';
                        // Revalidar permissão e nível após carregamento assíncrono.
                        const access=window.Profile.role==='admin'||window.Profile.permissions?.[game.id]===true;
                        if(!access || window.Profile.level < fase.reqLvl)throw new Error('Jogo ou fase não autorizados.');
                        sys.resultLocked=false;
                        sys.loopEpoch++;
                        sys.activeGame=game;
                        if(game.logic.init)game.logic.init(fase);
                        window.ArcadeControls?.activate(game);
                        document.getElementById('loading').classList.add('hidden');
                        document.getElementById('game-ui').classList.remove('hidden');
                        sys.loop();
                    } catch(error) {
                        console.error('Não foi possível iniciar a partida:',error);
                        sys.stopGame();
                        document.getElementById('loading').classList.add('hidden');
                        document.getElementById('game-ui').classList.add('hidden');
                        document.getElementById('phase-screen').classList.remove('hidden');
                        sys.msg('Não foi possível abrir a fase. Verifique permissões e sensores.');
                    } finally {sys.isStarting=false;}

                };
            } else {
                card.onclick = () => window.System.msg(`Requer Nível ${fase.reqLvl}`);
            }
            grid.appendChild(card);
        });
    },

    // Um frame por vez. Qualquer promessa de câmera atrasada é descartada
    // quando a partida é encerrada ou outra fase é iniciada.
    loop: async () => {
        const system = window.System;
        const game = system.activeGame;
        const epoch = system.loopEpoch;
        if (!game || system.busyEpoch === epoch) return;
        system.busyEpoch = epoch;
        system.loopId = null;
        try {
            if (!document.hidden && !system.paused) {
                const canvas = system.canvas;
                const w = canvas.width, h = canvas.height;
                let pose = null;
                const isAr = game.opts.camera === 'environment';
                if (!isAr && system.detector && system.video?.readyState === 4) {
                    try {
                        const people = await system.detector.estimatePoses(system.video, {flipHorizontal:false});
                        if (people?.length) pose = people[0];
                    } catch (error) {
                        if (!system.lastPoseWarning || performance.now()-system.lastPoseWarning > 15000) {
                            console.warn('Leitura de movimento temporariamente indisponível:',error);
                            system.lastPoseWarning=performance.now();
                        }
                    }
                }
                if (system.loopEpoch !== epoch || system.activeGame !== game) return;
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error('Canvas 2D indisponível.');
                let score = 0;
                ctx.save();
                try {
                    window.Gfx.updateShake(ctx);
                    score = game.logic.update(ctx,w,h,pose);
                } finally {ctx.restore();}
                if (system.loopEpoch !== epoch || system.activeGame !== game) return;
                const hud = document.getElementById('hud-score');
                if (hud) hud.innerText = String(Math.max(0,Math.floor(Number(score)||0)));
            }
        } catch (error) {
            console.error('Falha durante partida:',error);
            if (system.loopEpoch === epoch && system.activeGame === game) {
                system.menu();
                system.msg('Partida interrompida. Você pode tentar novamente.');
            }
        } finally {
            if (system.busyEpoch === epoch) system.busyEpoch = null;
            if (system.activeGame === game && system.loopEpoch === epoch) {
                system.loopId = requestAnimationFrame(system.loop);
            }
        }
    },

    stopGame: () => {
        window.ArcadeControls?.removeControls();
        window.System.paused=false;
        window.System.loopEpoch++;
        if(window.System.loopId) cancelAnimationFrame(window.System.loopId);
        window.System.loopId=null;
        if(window.System.activeGame?.logic.cleanup) window.System.activeGame.logic.cleanup();
        window.System.activeGame = null;
        if (window.System.video && window.System.video.srcObject) {
          try { window.System.video.srcObject.getTracks().forEach(t => t.stop()); } catch {}
          window.System.video.srcObject = null;
        }
        window.System.currentCameraMode = null;
    },
    menu: () => { 
        window.System.stopGame(); 
        document.getElementById('game-ui').classList.add('hidden');
        document.getElementById('screen-over').classList.add('hidden');
        document.getElementById('phase-screen').classList.add('hidden');
        document.getElementById('menu-screen').classList.remove('hidden');
        window.Profile.updateUI(); 
    },
    home: () => { window.Sfx.click(); window.System.menu(); },
    // Arcade: resultado -> fases do mesmo jogo em um toque, sem recarregar login.
    replay: () => {
        window.System.menu();
        const id=window.CONSOLE_GAME_ID;
        const game=(window.Games||[]).find(entry=>entry.id===id);
        const permitted=game && (window.Profile.role==='admin' || window.Profile.permissions?.[id]===true);
        if(permitted)window.System.openPhases(game);
    },
    
    gameOver: (score, isWin = true, coinsInGame = 0) => {
        if(window.System.resultLocked) return;
        window.System.resultLocked=true;
        window.System.stopGame();
        let finalScore = Math.floor(score || 0);
        
        let rewards = window.Profile.addReward(finalScore, isWin, coinsInGame);
        let rankData = window.Profile.getRank(finalScore, isWin);

        document.getElementById('result-header').innerText = isWin ? "MISSÃO CONCLUÍDA!" : "FALHA NA MISSÃO";
        document.getElementById('result-header').style.color = isWin ? "#2ecc71" : "#e74c3c";
        document.getElementById('result-score').innerText = finalScore;
        document.getElementById('result-status').innerText = rankData.msg;
        document.getElementById('result-xp').innerText = `+${rewards.xp}`;
        document.getElementById('result-coins').innerText = `+${rewards.coins}`;
        
        const rankStamp = document.getElementById('result-rank');
        rankStamp.innerText = rankData.rank;
        rankStamp.style.color = rankData.color;
        rankStamp.classList.remove('show');

        document.getElementById('game-ui').classList.add('hidden');
        document.getElementById('screen-over').classList.remove('hidden');
        
        setTimeout(() => {
            rankStamp.classList.add('show');
            if (isWin && (rankData.rank === 'S' || rankData.rank === 'A')) { window.Sfx.epic(); window.Gfx.shakeScreen(15); } 
            else if (isWin) { window.Sfx.coin(); }
            else { window.Sfx.error(); }
            if(rewards.leveledUp) setTimeout(() => window.System.msg("🔥 LEVEL UP! 🔥"), 1000);
        }, 300); 
    },

    resize: () => { if(window.System.canvas) { window.System.canvas.width = window.innerWidth; window.System.canvas.height = window.innerHeight; } },
    msg: (t) => {
        const el = document.getElementById('game-msg');
        if(el) { el.innerText = t; el.style.animation = 'none'; el.offsetHeight; el.style.animation = 'popMsg 1.5s forwards'; }
    }
};

const style = document.createElement('style');
style.innerHTML = `@keyframes popMsg { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; } 15% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; } 30% { transform: translate(-50%, -50%) scale(1); opacity: 1; } 80% { transform: translate(-50%, -50%) scale(1); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; } }`;
document.head.appendChild(style);

window.onload = async () => {
    if(window.ConsolePractice?.active && window.System.canvas)return;
    window.System.canvas = document.getElementById('game-canvas'); window.System.video = document.getElementById('webcam');
    window.System.resize(); window.addEventListener('resize', window.System.resize);

    window.System.detectorPromise = null;
    window.System.ensureDetector = async () => {
      if (window.System.detector) return window.System.detector;
      if (window.System.detectorPromise) return window.System.detectorPromise;
      if ((typeof tf === 'undefined' || typeof poseDetection === 'undefined') && window.ConsoleMotionRuntime)await window.ConsoleMotionRuntime.load();
      if (typeof tf === 'undefined' || typeof poseDetection === 'undefined') return null;
      window.System.detectorPromise = (async () => {
        await tf.ready();
        const result = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
        });
        window.System.detector = result;
        return result;
      })().catch(error => { console.warn('Sensor de movimento indisponível:', error); return null; })
      .finally(() => { window.System.detectorPromise = null; });
      return window.System.detectorPromise;
    };

    if(window.ConsolePractice?.active)return;
    if(!window.AuthApp){document.getElementById('loading').classList.add('hidden');document.getElementById('auth-screen').classList.remove('hidden');const error=document.getElementById('auth-error');if(error){error.textContent='Conta online indisponível. Você pode jogar sozinho ou tentar mais tarde.';error.style.display='block';}return;}
    window.System.authUnsubscribe?.();
    window.System.authUnsubscribe = window.AuthApp.onAuthStateChanged(async (user) => {
        if(window.ConsolePractice?.active)return;
        if (user) {
            window.System.playerId = user.uid;
            document.getElementById('loading-text').innerText = "SINCRONIZANDO PERFIL...";
            await window.Profile.loadFromFirebase(user.uid);
            if(window.ConsolePractice?.active)return;
            
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('menu-screen').classList.remove('hidden');
        } else {
            window.System.playerId = null;
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('menu-screen').classList.add('hidden');
            document.getElementById('auth-screen').classList.remove('hidden');
        }
    });
};
