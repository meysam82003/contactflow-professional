(function(root){
  'use strict';
  const VERSION='3.6.0';
  const androidWaiters=new Map();
  async function toBase64(blob){const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(binary)}
  function onAndroidDocumentReady(token,ok,message=''){
    const waiter=androidWaiters.get(String(token));if(!waiter)return;
    androidWaiters.delete(String(token));waiter.resolve({ok:ok===true||ok==='true',message:String(message||'')});
  }
  async function saveAndroidStream(blob,name,type){
    const token=`cf-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const ready=new Promise((resolve,reject)=>androidWaiters.set(token,{resolve,reject}));
    try{root.ContactFlowAndroid.beginDocumentSave(name,type,token,String(blob.size));}
    catch(error){androidWaiters.delete(token);throw error}
    const opened=await ready;
    if(!opened.ok)return {method:'cancelled',name,message:opened.message};
    try{
      const chunkSize=384*1024;
      for(let offset=0,part=0;offset<blob.size;offset+=chunkSize,part++){
        const error=String(root.ContactFlowAndroid.appendDocumentChunk(token,await toBase64(blob.slice(offset,Math.min(blob.size,offset+chunkSize))))||'');
        if(error)throw new Error(error);
        if(part%8===7)await new Promise(resolve=>setTimeout(resolve,0));
      }
      const error=String(root.ContactFlowAndroid.finishDocumentSave(token)||'');
      if(error)throw new Error(error);
      return {method:'android-document-stream',name,bytes:blob.size};
    }catch(error){try{root.ContactFlowAndroid.abortDocumentSave(token)}catch{}throw error}
  }
  async function save(blob,name,options={}){
    const type=blob.type||options.type||'application/octet-stream',mime=String(type).split(';')[0]||'application/octet-stream',extension='.'+(String(name).split('.').pop()||'dat').replace(/[^a-z0-9]/gi,'');
    if(root.ContactFlowAndroid?.beginDocumentSave&&root.ContactFlowAndroid?.appendDocumentChunk&&root.ContactFlowAndroid?.finishDocumentSave)return saveAndroidStream(blob,name,type);
    if(root.ContactFlowAndroid?.saveDocument){root.ContactFlowAndroid.saveDocument(name,type,await toBase64(blob));return {method:'android-document',name}}
    if(root.showSaveFilePicker){
      try{const handle=await root.showSaveFilePicker({suggestedName:name,types:[{description:options.description||'ContactFlow file',accept:{[mime]:[extension]}}]});const writable=await handle.createWritable();await writable.write(blob);await writable.close();return {method:'file-picker',name:handle.name||name}}
      catch(error){if(error?.name==='AbortError')return {method:'cancelled',name};throw error}
    }
    const file=new File([blob],name,{type});
    if(options.share&&navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){await navigator.share({files:[file],title:name});return {method:'share',name}}
    const url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download=name;anchor.rel='noopener';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),4000);return {method:'download-fallback',name};
  }
  root.ContactFlowFileSave={VERSION,save,onAndroidDocumentReady,capabilities(){return {androidDocument:!!root.ContactFlowAndroid?.saveDocument,androidStreaming:!!root.ContactFlowAndroid?.beginDocumentSave,filePicker:!!root.showSaveFilePicker,share:!!navigator.share,offline:true}}};
})(typeof globalThis!=='undefined'?globalThis:this);
