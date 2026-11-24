export function translateSource(text:string,values?:Record<string,string|number>) { return text.replace(/\{\{(\w+)\}\}/g,(_,key)=>String(values?.[key]??'')); }
