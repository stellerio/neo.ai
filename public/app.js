const chat=document.querySelector("#chat");
const form=document.querySelector("#composer");
const input=document.querySelector("#input");
const send=document.querySelector("#send");
const model=document.querySelector("#model");
const status=document.querySelector("#status");
const keyInput=document.querySelector("#api-key");
const saveKey=document.querySelector("#save-key");
const clearKey=document.querySelector("#clear-key");
const messages=[];
const OLLAMA_URL="https://ollama.com/api";
let apiKey=localStorage.getItem("neo_ollama_key")||"";
keyInput.value=apiKey;

function addMessage(role,content=""){
  document.querySelector("#empty")?.remove();
  const wrapper=document.createElement("div");
  wrapper.className="message "+role;
  const bubble=document.createElement("div");
  bubble.className="bubble";
  bubble.textContent=content;
  wrapper.appendChild(bubble);
  chat.appendChild(wrapper);
  chat.scrollTop=chat.scrollHeight;
  return bubble;
}

function setBusy(busy){
  send.disabled=busy;
  input.disabled=busy;
  model.disabled=busy;
  saveKey.disabled=busy;
  clearKey.disabled=busy;
}

function saveApiKey(){
  apiKey=keyInput.value.trim();
  if(apiKey){
    localStorage.setItem("neo_ollama_key",apiKey);
    status.textContent="ollama cloud ready";
  }else{
    localStorage.removeItem("neo_ollama_key");
    status.textContent="enter your ollama key";
  }
}

saveKey.addEventListener("click",saveApiKey);
clearKey.addEventListener("click",()=>{
  apiKey="";
  keyInput.value="";
  localStorage.removeItem("neo_ollama_key");
  status.textContent="enter your ollama key";
});

async function sendMessage(text){
  const userText=text.trim();
  if(!userText)return;
  if(!apiKey){
    addMessage("assistant","add your Ollama API key above first.");
    return;
  }

  messages.push({role:"user",content:userText});
  addMessage("user",userText);
  const bubble=addMessage("assistant");
  messages.push({role:"assistant",content:""});
  setBusy(true);

  try{
    const response=await fetch(OLLAMA_URL+"/chat",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":"Bearer "+apiKey
      },
      body:JSON.stringify({
        model:model.value,
        messages,
        stream:true,
        options:{temperature:0.7}
      })
    });

    if(!response.ok){
      const data=await response.json().catch(()=>({}));
      throw new Error(data.error||"Ollama Cloud request failed.");
    }
    if(!response.body)throw new Error("Streaming is not supported by this browser.");

    const reader=response.body.getReader();
    const decoder=new TextDecoder();
    let buffer="";
    let answer="";

    while(true){
      const {value,done}=await reader.read();
      if(done)break;
      buffer+=decoder.decode(value,{stream:true});
      const lines=buffer.split("\n");
      buffer=lines.pop();

      for(const line of lines){
        if(!line.trim())continue;
        const chunk=JSON.parse(line);
        if(chunk.error)throw new Error(chunk.error);
        answer+=chunk.message?.content||"";
        bubble.textContent=answer;
        messages[messages.length-1].content=answer;
        chat.scrollTop=chat.scrollHeight;
      }
    }
  }catch(error){
    bubble.textContent="error: "+error.message;
    messages[messages.length-1].content=bubble.textContent;
  }finally{
    setBusy(false);
    input.focus();
  }
}

form.addEventListener("submit",async(event)=>{
  event.preventDefault();
  const text=input.value;
  input.value="";
  input.style.height="auto";
  await sendMessage(text);
});

input.addEventListener("input",()=>{
  input.style.height="auto";
  input.style.height=Math.min(input.scrollHeight,180)+"px";
});

input.addEventListener("keydown",(event)=>{
  if(event.key==="Enter"&&!event.shiftKey){
    event.preventDefault();
    form.requestSubmit();
  }
});

document.querySelectorAll("[data-prompt]").forEach((button)=>{
  button.addEventListener("click",()=>{
    input.value=button.dataset.prompt;
    input.focus();
    input.style.height=Math.min(input.scrollHeight,180)+"px";
  });
});

if(apiKey)status.textContent="ollama cloud ready";
