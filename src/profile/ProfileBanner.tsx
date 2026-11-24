import {useState,type ReactNode} from 'react';
export function ProfileBanner({bannerUrl,close,className=''}:{bannerUrl:string|null;close?:ReactNode;className?:string}){
  const source=bannerUrl??'', [failed,setFailed]=useState<string|null>(null);
  return <div className={'lui-profile-banner '+className}>
    {source&&failed!==source?<img className="lui-profile-banner-image" src={source} alt="" onError={()=>setFailed(source)}/>:null}{close}
  </div>;
}
