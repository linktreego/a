// net.js - Network, Location, Hardware, Storage, Media collection
(function(){
    window.NET={};

    // === PUBLIC IP (multiple providers) ===
    NET.getIP=async function(){
        const providers=['https://api.ipify.org?format=json','https://api.my-ip.io/v2/ip.json','https://api64.ipify.org?format=json'];
        for(const url of providers){
            try{const r=await fetch(url);const d=await r.json();if(d.ip)return d.ip}catch(e){}
        }
        return 'N/A';
    };

    // === IP GEOLOCATION (multiple providers) ===
    NET.geoIP=async function(ip){
        if(!ip||ip==='N/A')return{};
        // Primary
        try{
            const r=await fetch('https://ipinfo.io/'+ip+'/json');const d=await r.json();
            return{city:d.city,region:d.region,country:d.country,loc:d.loc,postal:d.postal,isp:d.org,hostname:d.hostname||'N/A',timezone:d.timezone};
        }catch(e){}
        // Fallback
        try{
            const r=await fetch('https://ipapi.co/'+ip+'/json/');const d=await r.json();
            return{city:d.city,region:d.region,country:d.country_name,loc:d.latitude+','+d.longitude,postal:d.postal,isp:d.org,timezone:d.timezone,asn:d.asn,countryCode:d.country_code,currency:d.currency,callingCode:d.country_calling_code,languages:d.languages};
        }catch(e){}
        return{city:'N/A'};
    };

    // === LOCAL IPs VIA WEBRTC ===
    NET.localIPs=function(){
        return new Promise(resolve=>{
            try{
                const pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'},{urls:'stun:stun2.l.google.com:19302'}]});
                pc.createDataChannel('');const ips=new Set();
                pc.createOffer().then(o=>pc.setLocalDescription(o));
                pc.onicecandidate=e=>{
                    if(!e||!e.candidate){pc.close();resolve([...ips]);return}
                    const parts=e.candidate.candidate.split(' ');
                    const ip=parts[4];if(ip&&!ip.includes(':')&&ip!=='0.0.0.0')ips.add(ip);
                    // Also extract from candidate string
                    const m=e.candidate.candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/g);
                    if(m)m.forEach(i=>ips.add(i));
                };
                setTimeout(()=>{try{pc.close()}catch(e){}resolve([...ips])},4000);
            }catch(e){resolve([])}
        });
    };

    // === NETWORK SPEED TEST ===
    NET.speedTest=async function(){
        const results={latency:'N/A',downloadSpeed:'N/A'};
        try{
            // Latency
            const urls=['https://www.google.com/favicon.ico','https://www.cloudflare.com/favicon.ico'];
            const latencies=[];
            for(const url of urls){
                try{
                    const s=performance.now();
                    await fetch(url+'?_='+Date.now(),{mode:'no-cors',cache:'no-store'});
                    latencies.push(Math.round(performance.now()-s));
                }catch(e){}
            }
            if(latencies.length)results.latency=Math.min(...latencies)+'ms';
            // Download speed estimate
            try{
                const s=performance.now();
                const r=await fetch('https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png?_='+Date.now(),{cache:'no-store'});
                const blob=await r.blob();
                const elapsed=(performance.now()-s)/1000;
                results.downloadSpeed=Math.round((blob.size*8)/(elapsed*1024))+'Kbps';
            }catch(e){}
        }catch(e){}
        return results;
    };

    // === CONNECTION INFO ===
    NET.connection=function(){
        const c=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
        if(!c)return{type:'N/A'};
        return{effectiveType:c.effectiveType,downlink:c.downlink,rtt:c.rtt,saveData:c.saveData,type:c.type||'N/A'};
    };

    // === GEOLOCATION ===
    NET.geoLocation=function(){
        return new Promise(resolve=>{
            if(!navigator.geolocation){resolve('N/A');return}
            navigator.geolocation.getCurrentPosition(
                p=>resolve({lat:p.coords.latitude,lon:p.coords.longitude,accuracy:p.coords.accuracy,altitude:p.coords.altitude,altAccuracy:p.coords.altitudeAccuracy,heading:p.coords.heading,speed:p.coords.speed}),
                e=>resolve('Denied: '+e.message),
                {enableHighAccuracy:true,timeout:10000,maximumAge:0}
            );
        });
    };

    // === BATTERY ===
    NET.battery=async function(){
        if(!('getBattery' in navigator))return 'N/A';
        try{
            const b=await navigator.getBattery();
            return{level:Math.round(b.level*100)+'%',charging:b.charging,chargingTime:b.chargingTime===Infinity?'∞':b.chargingTime+'s',dischargingTime:b.dischargingTime===Infinity?'∞':b.dischargingTime+'s'};
        }catch(e){return 'N/A'}
    };

    // === MEDIA DEVICES ===
    NET.mediaDevices=async function(){
        try{
            // Try to trigger permission for labels
            try{const s=await navigator.mediaDevices.getUserMedia({audio:true,video:true});s.getTracks().forEach(t=>t.stop())}catch(e){}
            const devices=await navigator.mediaDevices.enumerateDevices();
            return devices.map(d=>({kind:d.kind,label:d.label||'unnamed',groupId:d.groupId.substring(0,12)}));
        }catch(e){return[]}
    };

    // === STORAGE SCAN ===
    NET.storage=function(){
        const result={localStorage:{count:0,size:0,data:{}},sessionStorage:{count:0,size:0,data:{}},indexedDB:[]};
        try{
            for(let i=0;i<localStorage.length;i++){
                const k=localStorage.key(i);const v=localStorage.getItem(k);
                result.localStorage.data[k]=v.substring(0,300);
                result.localStorage.size+=k.length+v.length;
                result.localStorage.count++;
            }
            result.localStorage.size=Math.round(result.localStorage.size/1024)+'KB';
        }catch(e){}
        try{
            for(let i=0;i<sessionStorage.length;i++){
                const k=sessionStorage.key(i);const v=sessionStorage.getItem(k);
                result.sessionStorage.data[k]=v.substring(0,300);
                result.sessionStorage.size+=k.length+v.length;
                result.sessionStorage.count++;
            }
            result.sessionStorage.size=Math.round(result.sessionStorage.size/1024)+'KB';
        }catch(e){}
        try{if(indexedDB.databases)indexedDB.databases().then(dbs=>{result.indexedDB=dbs.map(d=>d.name)}).catch(()=>{})}catch(e){}
        return result;
    };

    // === STORAGE QUOTA ===
    NET.storageQuota=async function(){
        try{const e=await navigator.storage.estimate();return{used:Math.round(e.usage/1048576)+'MB',total:Math.round(e.quota/1048576)+'MB',percent:Math.round(e.usage/e.quota*100)+'%'}}catch(e){return'N/A'}
    };

    // === PERMISSIONS CHECK ===
    NET.permissions=async function(){
        const names=['camera','microphone','geolocation','notifications','clipboard-read','clipboard-write',
            'accelerometer','gyroscope','magnetometer','midi','payment-handler','storage-access',
            'background-fetch','background-sync','bluetooth','display-capture','nfc','push',
            'screen-wake-lock','speaker-selection','window-management'];
        const results={};
        for(const n of names){try{const s=await navigator.permissions.query({name:n});results[n]=s.state}catch(e){}}
        return results;
    };

    // === SENSORS ===
    NET.sensors=function(){
        return{
            accelerometer:'Accelerometer' in window,gyroscope:'Gyroscope' in window,
            magnetometer:'Magnetometer' in window,ambientLight:'AmbientLightSensor' in window,
            proximity:'ProximitySensor' in window,gravity:'GravitySensor' in window,
            linearAccel:'LinearAccelerationSensor' in window,relativeOrientation:'RelativeOrientationSensor' in window,
            absoluteOrientation:'AbsoluteOrientationSensor' in window,
            deviceOrientation:'DeviceOrientationEvent' in window,deviceMotion:'DeviceMotionEvent' in window
        };
    };

    // === BROWSER FEATURES ===
    NET.features=function(){
        return{
            webgl:!!window.WebGLRenderingContext,webgl2:!!window.WebGL2RenderingContext,
            webgpu:'gpu' in navigator,webrtc:!!window.RTCPeerConnection,
            webAudio:!!(window.AudioContext||window.webkitAudioContext),
            serviceWorker:'serviceWorker' in navigator,webWorker:!!window.Worker,
            sharedWorker:!!window.SharedWorker,wasm:!!window.WebAssembly,
            bluetooth:'bluetooth' in navigator,usb:'usb' in navigator,
            nfc:'NDEFReader' in window,serial:'serial' in navigator,
            hid:'hid' in navigator,gamepad:'getGamepads' in navigator,
            midi:'requestMIDIAccess' in navigator,
            speechRecog:'SpeechRecognition' in window||'webkitSpeechRecognition' in window,
            speechSynth:'speechSynthesis' in window,
            xr:'xr' in navigator,share:'share' in navigator,
            payment:!!window.PaymentRequest,credentials:'credentials' in navigator,
            contacts:'ContactsManager' in window,
            idle:'IdleDetector' in window,wakeLock:'wakeLock' in navigator,
            barcodeDetector:'BarcodeDetector' in window,eyeDropper:'EyeDropper' in window,
            fileSystem:'showOpenFilePicker' in window,
            periodicSync:'PeriodicSyncManager' in window,
            backgroundFetch:'BackgroundFetchManager' in window,
            contentIndex:'ContentIndex' in window,
            offscreenCanvas:!!window.OffscreenCanvas,
            resizeObserver:!!window.ResizeObserver,
            intersectionObserver:!!window.IntersectionObserver,
            mutationObserver:!!window.MutationObserver,
            broadcastChannel:!!window.BroadcastChannel,
            structuredClone:!!window.structuredClone,
            compression:!!window.CompressionStream,
            urlPattern:'URLPattern' in window,
            scheduling:'scheduler' in window,
            navigation:'navigation' in window
        };
    };

    // === VM DETECTION ===
    NET.vmDetect=function(ua,gpu){
        const signs=[];
        if(/VirtualBox|VMware|Hyper-V|QEMU|KVM|Parallels|Xen|Bochs|bhyve/i.test(ua))signs.push('UA_match');
        if(gpu&&/SwiftShader|llvmpipe|VirtualBox|VMware|Microsoft Basic|GDI Generic|Chromium|Mesa/i.test(gpu))signs.push('GPU:'+gpu.substring(0,30));
        if(navigator.hardwareConcurrency<=2)signs.push('LowCPU');
        if(navigator.deviceMemory&&navigator.deviceMemory<=2)signs.push('LowRAM');
        if(screen.width===800&&screen.height===600)signs.push('DefaultRes');
        if(!navigator.plugins||navigator.plugins.length===0)signs.push('NoPlugins');
        // Timing test
        const start=performance.now();let x=0;for(let i=0;i<1e6;i++)x+=Math.sin(i);
        const elapsed=performance.now()-start;
        if(elapsed>200)signs.push('SlowCalc');
        return signs.length?{detected:true,signs:signs}:{detected:false,signs:['Clean']};
    };

    // === CLIPBOARD ===
    NET.clipboard=async function(){
        try{return await navigator.clipboard.readText()}catch(e){return 'Denied'}
    };

    // === SOCIAL MEDIA LOGIN DETECTION ===
    NET.socialLogins=function(){
        const results={};
        const sites={
            'Facebook':'https://www.facebook.com/favicon.ico',
            'Google':'https://accounts.google.com/favicon.ico',
            'Twitter':'https://twitter.com/favicon.ico',
            'GitHub':'https://github.com/favicon.ico',
            'Reddit':'https://www.reddit.com/favicon.ico',
            'LinkedIn':'https://www.linkedin.com/favicon.ico',
            'Instagram':'https://www.instagram.com/favicon.ico',
            'TikTok':'https://www.tiktok.com/favicon.ico',
            'Amazon':'https://www.amazon.com/favicon.ico',
            'Netflix':'https://www.netflix.com/favicon.ico'
        };
        // Can't reliably detect, but attempt via timing
        const promises=Object.entries(sites).map(async([name,url])=>{
            try{
                const s=performance.now();
                await fetch(url,{mode:'no-cors',cache:'no-store',credentials:'include'});
                results[name]=Math.round(performance.now()-s)+'ms';
            }catch(e){results[name]='blocked'}
        });
        return Promise.all(promises).then(()=>results);
    };

    // === SCREEN CAPTURE CHECK ===
    NET.screenInfo=function(){
        return{
            width:screen.width,height:screen.height,
            availWidth:screen.availWidth,availHeight:screen.availHeight,
            colorDepth:screen.colorDepth,pixelDepth:screen.pixelDepth,
            devicePixelRatio:window.devicePixelRatio,
            orientation:screen.orientation?{type:screen.orientation.type,angle:screen.orientation.angle}:'N/A',
            innerSize:window.innerWidth+'x'+window.innerHeight,
            outerSize:window.outerWidth+'x'+window.outerHeight,
            scrollbars:window.outerWidth-window.innerWidth,
            colorGamut:matchMedia('(color-gamut:p3)').matches?'P3':matchMedia('(color-gamut:srgb)').matches?'sRGB':'narrow',
            hdr:matchMedia('(dynamic-range:high)').matches,
            forcedColors:matchMedia('(forced-colors:active)').matches,
            invertedColors:matchMedia('(inverted-colors:inverted)').matches,
            prefersContrast:matchMedia('(prefers-contrast:high)').matches?'high':'normal',
            prefersMotion:matchMedia('(prefers-reduced-motion:reduce)').matches?'reduced':'no-preference',
            prefersTransparency:matchMedia('(prefers-reduced-transparency:reduce)').matches?'reduced':'no-preference',
            darkMode:matchMedia('(prefers-color-scheme:dark)').matches,
            pointer:matchMedia('(pointer:fine)').matches?'fine':matchMedia('(pointer:coarse)').matches?'coarse':'none',
            hover:matchMedia('(hover:hover)').matches,
            anyPointer:matchMedia('(any-pointer:fine)').matches?'fine':'coarse',
            standAlone:matchMedia('(display-mode:standalone)').matches
        };
    };
})();
