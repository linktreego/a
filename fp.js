// fp.js - Advanced Fingerprinting Engine
(function(){
    // === CANVAS FINGERPRINT ===
    window.FP={};
    FP.canvas=function(){
        try{
            const c=document.createElement('canvas');c.width=300;c.height=150;
            const ctx=c.getContext('2d');
            ctx.textBaseline='alphabetic';
            ctx.fillStyle='#f60';ctx.fillRect(10,1,62,20);
            ctx.fillStyle='#069';ctx.font='11pt Arial';ctx.fillText('Cwm fjord bank',2,15);
            ctx.fillStyle='rgba(102,204,0,0.7)';ctx.font='18pt Arial';ctx.fillText('😀🔥abc',4,45);
            ctx.globalCompositeOperation='multiply';
            ctx.fillStyle='rgb(255,0,255)';ctx.beginPath();ctx.arc(50,50,50,0,Math.PI*2);ctx.closePath();ctx.fill();
            ctx.fillStyle='rgb(0,255,255)';ctx.beginPath();ctx.arc(100,50,50,0,Math.PI*2);ctx.closePath();ctx.fill();
            ctx.fillStyle='rgb(255,255,0)';ctx.beginPath();ctx.arc(75,80,50,0,Math.PI*2);ctx.closePath();ctx.fill();
            // Additional shapes
            ctx.strokeStyle='#ff0000';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(50,100,150,0,300,150);ctx.stroke();
            const d=c.toDataURL();
            return U.hash(d);
        }catch(e){return 'N/A'}
    };

    // === WEBGL FINGERPRINT ===
    FP.webgl=function(){
        try{
            const c=document.createElement('canvas');
            const gl=c.getContext('webgl2')||c.getContext('webgl')||c.getContext('experimental-webgl');
            if(!gl)return{renderer:'N/A'};
            const dbg=gl.getExtension('WEBGL_debug_renderer_info');
            const info={
                renderer:dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):'N/A',
                vendor:dbg?gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL):'N/A',
                version:gl.getParameter(gl.VERSION),
                shadingLang:gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
                maxTexSize:gl.getParameter(gl.MAX_TEXTURE_SIZE),
                maxCubeMapSize:gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
                maxRenderBufSize:gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
                maxViewportDims:gl.getParameter(gl.MAX_VIEWPORT_DIMS),
                maxVertexAttribs:gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
                maxVertexUniforms:gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
                maxFragUniforms:gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
                maxVaryings:gl.getParameter(gl.MAX_VARYING_VECTORS),
                aliasedLineWidthRange:gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE),
                aliasedPointSizeRange:gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE),
                antialias:gl.getContextAttributes().antialias,
                extensions:gl.getSupportedExtensions()
            };
            // WebGL render fingerprint
            c.width=256;c.height=256;
            const vs='attribute vec2 p;void main(){gl_Position=vec4(p,0,1);}';
            const fs='precision mediump float;void main(){gl_FragColor=vec4(0.86,0.24,0.11,1);}';
            const vShader=gl.createShader(gl.VERTEX_SHADER);gl.shaderSource(vShader,vs);gl.compileShader(vShader);
            const fShader=gl.createShader(gl.FRAGMENT_SHADER);gl.shaderSource(fShader,fs);gl.compileShader(fShader);
            const prog=gl.createProgram();gl.attachShader(prog,vShader);gl.attachShader(prog,fShader);gl.linkProgram(prog);gl.useProgram(prog);
            const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
            gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-.5,-.5,.5,-.5,0,.5]),gl.STATIC_DRAW);
            const loc=gl.getAttribLocation(prog,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
            gl.drawArrays(gl.TRIANGLES,0,3);
            info.renderHash=U.hash(c.toDataURL());
            return info;
        }catch(e){return{renderer:'Error'}}
    };

    // === AUDIO FINGERPRINT ===
    FP.audio=function(){
        return new Promise(resolve=>{
            try{
                const AudioCtx=window.OfflineAudioContext||window.webkitOfflineAudioContext;
                if(!AudioCtx){resolve('N/A');return}
                const ctx=new AudioCtx(1,44100,44100);
                const osc=ctx.createOscillator();
                osc.type='triangle';osc.frequency.setValueAtTime(10000,ctx.currentTime);
                const comp=ctx.createDynamicsCompressor();
                comp.threshold.setValueAtTime(-50,ctx.currentTime);
                comp.knee.setValueAtTime(40,ctx.currentTime);
                comp.ratio.setValueAtTime(12,ctx.currentTime);
                comp.attack.setValueAtTime(0,ctx.currentTime);
                comp.release.setValueAtTime(.25,ctx.currentTime);
                osc.connect(comp);comp.connect(ctx.destination);
                osc.start(0);
                ctx.startRendering().then(buf=>{
                    const data=buf.getChannelData(0);
                    let sum=0;for(let i=4500;i<5000;i++)sum+=Math.abs(data[i]);
                    resolve(sum.toString().slice(0,20));
                }).catch(()=>resolve('N/A'));
                setTimeout(()=>resolve('timeout'),3000);
            }catch(e){resolve('N/A')}
        });
    };

    // === FONT DETECTION ===
    FP.fonts=function(){
        const testFonts=['Arial','Arial Black','Arial Narrow','Bookman Old Style','Calibri','Cambria','Cambria Math',
            'Century','Century Gothic','Comic Sans MS','Consolas','Constantia','Corbel','Courier','Courier New',
            'Ebrima','Franklin Gothic','Gadugi','Garamond','Georgia','HoloLens MDL2 Assets','Impact',
            'Ink Free','Javanese Text','Leelawadee UI','Lucida Console','Lucida Sans','MS Gothic','MS PGothic',
            'MS Sans Serif','MS Serif','MS UI Gothic','MV Boli','Malgun Gothic','Marlett','Microsoft Himalaya',
            'Microsoft JhengHei','Microsoft New Tai Lue','Microsoft PhagsPa','Microsoft Sans Serif',
            'Microsoft Tai Le','Microsoft YaHei','Microsoft Yi Baiti','MingLiU','Mongolian Baiti',
            'Nirmala UI','Palatino Linotype','Segoe MDL2 Assets','Segoe Print','Segoe Script','Segoe UI',
            'Segoe UI Emoji','Segoe UI Symbol','SimSun','Sitka Text','Sylfaen','Symbol','Tahoma',
            'Times New Roman','Trebuchet MS','Verdana','Webdings','Wingdings','Yu Gothic'];
        const detected=[];
        const body=document.body;
        const baseFonts=['monospace','sans-serif','serif'];
        const testString='mmmmmmmmmmlli1|!@#$%';
        const testSize='72px';
        const spans={};const baseDims={};
        const holder=document.createElement('div');
        holder.style.cssText='position:absolute;left:-9999px;top:-9999px;visibility:hidden';
        body.appendChild(holder);
        baseFonts.forEach(bf=>{
            const s=document.createElement('span');
            s.style.cssText='font-size:'+testSize+';font-family:'+bf;
            s.textContent=testString;
            holder.appendChild(s);
            baseDims[bf]={w:s.offsetWidth,h:s.offsetHeight};
            spans[bf]=s;
        });
        testFonts.forEach(f=>{
            let found=false;
            baseFonts.forEach(bf=>{
                const s=document.createElement('span');
                s.style.cssText='font-size:'+testSize+';font-family:"'+f+'",'+bf;
                s.textContent=testString;
                holder.appendChild(s);
                if(s.offsetWidth!==baseDims[bf].w||s.offsetHeight!==baseDims[bf].h)found=true;
            });
            if(found)detected.push(f);
        });
        body.removeChild(holder);
        return detected;
    };

    // === CSS FEATURE DETECTION ===
    FP.cssFeatures=function(){
        const features={};
        const tests={'grid':'display:grid','flex':'display:flex','backdrop-filter':'backdrop-filter:blur(1px)',
            'position-sticky':'position:sticky','aspect-ratio':'aspect-ratio:1','container-query':'container-type:inline-size',
            'color-mix':'color:color-mix(in srgb,red,blue)','has-selector':':has(*)','nesting':'&','subgrid':'grid-template-columns:subgrid',
            'scroll-snap':'scroll-snap-type:x mandatory','writing-mode':'writing-mode:vertical-rl',
            'object-fit':'object-fit:cover','gap':'gap:1px','clamp':'width:clamp(1px,2px,3px)'};
        for(const[name,css] of Object.entries(tests)){
            try{features[name]=CSS.supports(css)}catch(e){features[name]=false}
        }
        return features;
    };

    // === SPEECH VOICES ===
    FP.voices=function(){
        try{
            const voices=speechSynthesis.getVoices();
            return voices.map(v=>({name:v.name,lang:v.lang,local:v.localService}));
        }catch(e){return[]}
    };

    // === MATH FINGERPRINT ===
    FP.math=function(){
        return{
            acos:Math.acos(0.5),asin:Math.asin(0.5),atan:Math.atan(2),atan2:Math.atan2(1,2),
            cos:Math.cos(21),sin:Math.sin(1),tan:Math.tan(1),exp:Math.exp(10),
            log:Math.log(100),sqrt:Math.sqrt(2),cbrt:Math.cbrt(100),
            cosh:Math.cosh(1),sinh:Math.sinh(1),tanh:Math.tanh(1),
            expm1:Math.expm1(1),log1p:Math.log1p(10),log2:Math.log2(10),log10:Math.log10(2),
            E:Math.E,LN2:Math.LN2,LN10:Math.LN10,PI:Math.PI,SQRT2:Math.SQRT2
        };
    };

    // === PERFORMANCE FINGERPRINT ===
    FP.performance=function(){
        const p=window.performance;
        if(!p)return'N/A';
        const result={};
        if(p.timing){
            const t=p.timing;
            result.pageLoad=t.loadEventEnd-t.navigationStart;
            result.domReady=t.domContentLoadedEventEnd-t.navigationStart;
            result.dns=t.domainLookupEnd-t.domainLookupStart;
            result.tcp=t.connectEnd-t.connectStart;
            result.ttfb=t.responseStart-t.requestStart;
            result.redirect=t.redirectEnd-t.redirectStart;
        }
        if(p.memory){
            result.jsHeapLimit=Math.round(p.memory.jsHeapSizeLimit/1048576)+'MB';
            result.jsHeapUsed=Math.round(p.memory.usedJSHeapSize/1048576)+'MB';
            result.jsHeapTotal=Math.round(p.memory.totalJSHeapSize/1048576)+'MB';
        }
        result.entries=p.getEntries?p.getEntries().length:0;
        return result;
    };

    // === INCOGNITO DETECTION ===
    FP.incognito=function(){
        return new Promise(resolve=>{
            // Check storage quota
            if(navigator.storage&&navigator.storage.estimate){
                navigator.storage.estimate().then(est=>{
                    resolve(est.quota<120000000?'Likely':'No');
                }).catch(()=>resolve('Unknown'));
            }else{
                // Fallback: try to use FileSystem API
                const fs=window.RequestFileSystem||window.webkitRequestFileSystem;
                if(fs){fs(0,0,()=>resolve('No'),()=>resolve('Likely'))}
                else resolve('Unknown');
            }
        });
    };

    // === ADBLOCKER DETECTION ===
    FP.adblock=function(){
        return new Promise(resolve=>{
            const ad=document.createElement('div');
            ad.innerHTML='&nbsp;';
            ad.className='adsbox ad-banner ad-placement textads banner-ads';
            ad.style.cssText='position:absolute;left:-9999px;top:-9999px;width:1px;height:1px';
            document.body.appendChild(ad);
            setTimeout(()=>{
                const blocked=ad.offsetHeight===0||ad.clientHeight===0||getComputedStyle(ad).display==='none';
                document.body.removeChild(ad);
                resolve(blocked);
            },100);
        });
    };

    // === AUTOMATION DETECTION ===
    FP.automation=function(){
        const signs=[];
        if(navigator.webdriver)signs.push('webdriver');
        if(window._phantom||window.__nightmare)signs.push('phantom/nightmare');
        if(window.callPhantom||window._phantomjs)signs.push('phantomjs');
        if(window.__selenium_unwrapped||window.__webdriver_evaluate)signs.push('selenium');
        if(window.domAutomation||window.domAutomationController)signs.push('domAutomation');
        if(document.__webdriver_script_fn)signs.push('webdriver_script');
        if(navigator.plugins.length===0&&navigator.languages.length===0)signs.push('headless_hints');
        if(!window.chrome&&/Chrome/.test(navigator.userAgent))signs.push('fake_chrome');
        const ua=navigator.userAgent.toLowerCase();
        if(ua.includes('headless'))signs.push('headless_ua');
        if(ua.includes('puppeteer'))signs.push('puppeteer');
        if(ua.includes('playwright'))signs.push('playwright');
        // Check for CDP
        try{if(window.cdc_adoQpoasnfa76pfcZLmcfl_Array)signs.push('chromedriver')}catch(e){}
        return signs.length?signs:['clean'];
    };
})();
