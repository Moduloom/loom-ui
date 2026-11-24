import {readAppLocale} from './locale.js';
const english:Record<string,string>={
  "正在加载": "Loading",
  "清除搜索": "Clear search",
  "请选择": "Please select",
  "{{p0}} 项已选择": "{{p0}} items selected",
  "选择日期": "Select date",
  "上个月": "Previous month",
  "下个月": "Next month",
  "清除日期": "Clear date",
  "今天": "Today",
  "已选择": "Selected",
  "关闭": "Close",
  "返回": "Back"
};
export function translateUiSource(source:string,values?:Record<string,unknown>){const text=readAppLocale()==='en-US'?(english[source]??source):source;return text.replace(/\{\{([^}]+)\}\}/g,(match,key)=>values?.[key]===undefined?match:String(values[key]));}
