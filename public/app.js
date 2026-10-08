const chat=document.querySelector("#chat");
const form=document.querySelector("#composer");
const input=document.querySelector("#input");
const send=document.querySelector("#send");
const model=document.querySelector("#model");
const status=document.querySelector("#status");
const messages=[];

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
}

async function checkHealth(){
  try{
    const response=await fetch("/api/health");
    const data=await response.json();
    if(!response.ok||!data.ok) throw new Error();
    status.textContent="ollama online · "+data.model;
  }catch{
    status.textContent="ollama offline";
  }
}

async function sendMessage(text){
  const userText=text.trim();
  if(!userText)return;

  messages.push({role:"user",content:userText});
  addMessage("user",userText);
  const bubble=addMessage("assistant");
  messages.push({role:"assistant",content:""});
  setBusy(true);

  try{
    const response=await fetch("/api/chat",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({model:model.value,messages})
    });

    if(!response.ok){
      const data=await response.json().catch(()=>({}));
      throw new Error(data.error||"Neo could not reach Ollama.");
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
        answer+=chunk.message||"";
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

checkHealth();
