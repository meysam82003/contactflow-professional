(function(root){
  'use strict';
  const VERSION='3.6.0';
  async function toBase64(blob){const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(binary)}
  async function save(blob,name,options={}){
    const type=blob.type||options.type||'application/octet-stream',mime=String(type).split(';')[0]||'application/octet-stream',extension='.'+(String(name).split('.').pop()||'dat').replace(/[^a-z0-9]/gi,'');
    if(root.ContactFlowAndroid?.saveDocument){root.ContactFlowAndroid.saveDocument(name,type,await toBase64(blob));return {method:'android-document',name}}
    if(root.showSaveFilePicker){
      try{const handle=await root.showSaveFilePicker({suggestedName:name,types:[{description:options.description||'ContactFlow file',accept:{[mime]:[extension]}}]});const writable=await handle.createWritable();await writable.write(blob);await writable.close();return {method:'file-picker',name:handle.name||name}}
      catch(error){if(error?.name==='AbortError')return {method:'cancelled',name};throw error}
    }
    const file=new File([blob],name,{type});
    if(options.share&&navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){await navigator.share({files:[file],title:name});return {method:'share',name}}
    const url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download=name;anchor.rel='noopener';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),4000);return {method:'download-fallback',name};
  }
  root.ContactFlowFileSave={VERSION,save,capabilities(){return {androidDocument:!!root.ContactFlowAndroid?.saveDocument,filePicker:!!root.showSaveFilePicker,share:!!navigator.share,offline:true}}};
})(typeof globalThis!=='undefined'?globalThis:this);
