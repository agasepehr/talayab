
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Section = "dashboard" | "shops" | "products" | "categories" | "users" | "analytics";

type Dashboard = {
  shops_total: number; shops_active: number; products_total: number; products_active: number;
  users_total: number; sellers_total: number; admins_total: number; categories_total: number;
  events_30d: number; product_views_30d: number; contact_clicks_30d: number; store_views_30d: number;
  market_gold18: number | null; market_updated_at: string | null; market_status: string;
};
type Shop = {
  id:number; owner_id:number|null; owner_name:string|null; owner_email:string|null; shop_name:string|null;
  city:string|null; phone:string|null; instagram:string|null; logo:string|null; description:string|null;
  latitude:number|null; longitude:number|null; status:string; created_at:string|null;
};
type Product = {
  id:number; shop_id:number; shop_name:string|null; category_id:number|null; category_name:string|null;
  title:string|null; description:string|null; weight:number|null; karat:number|null; wage_type:string|null;
  wage_value:number|null; profit_percent:number|null; extra_fee:number|null; image:string|null; status:string; created_at:string|null;
};
type Category = { id:number; name:string|null; image:string|null; parent_id:number|null; created_at:string|null };
type User = { id:number; full_name:string|null; email:string|null; phone:string|null; role:string; created_at:string|null };
type Analytics = {
  days:number;
  summary:{events:number; product_views:number; contact_clicks:number; map_clicks:number; instagram_clicks:number; list_impressions:number; store_page_views:number; unique_visitors:number};
  top_products:Array<{id:number;title:string|null;shop_name:string|null;views:number;contact_clicks:number;unique_views:number}>;
};

const nav:Array<{id:Section;label:string;icon:string}> = [
  {id:"dashboard",label:"داشبورد",icon:"⌂"},
  {id:"shops",label:"فروشگاه‌ها",icon:"▣"},
  {id:"products",label:"محصولات",icon:"◆"},
  {id:"categories",label:"دسته‌بندی‌ها",icon:"≡"},
  {id:"users",label:"کاربران",icon:"♙"},
  {id:"analytics",label:"آمار سایت",icon:"◫"},
];

function n(v:unknown){return new Intl.NumberFormat("fa-IR").format(Number(v ?? 0));}
function money(v:number|null|undefined){return v==null?"—":Math.round(v).toLocaleString("fa-IR")+" تومان";}
function date(v:string|null|undefined){return v?new Intl.DateTimeFormat("fa-IR",{dateStyle:"medium",timeStyle:"short"}).format(new Date(v)):"—";}
function errText(message:string){
  const map:Record<string,string>={
    not_authorized:"این حساب دسترسی مدیریت ندارد.",
    admin_account_not_configured:"حساب مدیر اصلی در سامانه تنظیم نشده است.",
    shop_name_required:"نام فروشگاه را وارد کنید.",
    owner_not_found:"مالک فروشگاه معتبر نیست.",
    title_required:"عنوان محصول را وارد کنید.",
    shop_not_found:"فروشگاه پیدا نشد.",
    category_not_found:"دسته‌بندی معتبر نیست.",
    category_name_required:"نام دسته‌بندی را وارد کنید.",
    parent_not_found:"والد دسته‌بندی معتبر نیست.",
    user_not_found:"کاربر پیدا نشد.",
    cannot_demote_self:"نمی‌توانید نقش خودتان را حذف کنید.",
    cannot_remove_last_admin:"آخرین مدیر سیستم را نمی‌توان تغییر داد.",
  };
  return map[message] ?? "عملیات ناموفق بود.";
}
function activeClass(status:string){return status==="active"?"bg-[#E8F5EE] text-[#17633F]":"bg-[#FCEBEC] text-[#A33C46]";}

export default function AdminPage(){
  const [session,setSession]=useState<unknown>(null);
  const [authorized,setAuthorized]=useState(false);
  const [boot,setBoot]=useState(true);
  const [email,setEmail]=useState("");
  const [authMsg,setAuthMsg]=useState("");
  const [authErr,setAuthErr]=useState("");
  const [authBusy,setAuthBusy]=useState(false);
  const [section,setSection]=useState<Section>("dashboard");
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const [dashboard,setDashboard]=useState<Dashboard|null>(null);
  const [shops,setShops]=useState<Shop[]>([]);
  const [products,setProducts]=useState<Product[]>([]);
  const [categories,setCategories]=useState<Category[]>([]);
  const [users,setUsers]=useState<User[]>([]);
  const [analytics,setAnalytics]=useState<Analytics|null>(null);
  const [days,setDays]=useState(30);
  const [query,setQuery]=useState("");

  const [shopId,setShopId]=useState<number|null>(null);
  const [shopForm,setShopForm]=useState({owner_id:"",shop_name:"",city:"ارومیه",phone:"",instagram:"",logo:"",description:"",latitude:"",longitude:"",status:"active"});
  const [productId,setProductId]=useState<number|null>(null);
  const [productForm,setProductForm]=useState({shop_id:"",category_id:"",title:"",description:"",weight:"",karat:"18",wage_value:"0",profit_percent:"0",extra_fee:"0",image:"",status:"active"});
  const [categoryId,setCategoryId]=useState<number|null>(null);
  const [categoryForm,setCategoryForm]=useState({name:"",image:"",parent_id:""});

  const rpcError=(e:{message?:string}|null, fallback:string)=>{ if(e){setError(errText(e.message??"")||fallback);} };

  const ensure=async()=>{
    const {data,error:e}=await supabase.rpc("claim_admin_identity");
    if(e||!data){setAuthorized(false);rpcError(e,"احراز هویت مدیر ناموفق بود.");return false;}
    const {data:dash,error:de}=await supabase.rpc("admin_get_dashboard");
    if(de){setAuthorized(false);rpcError(de,"این حساب دسترسی مدیریت ندارد.");return false;}
    setAuthorized(true);setDashboard(dash as Dashboard);return true;
  };

  const load=async(target:Section)=>{
    if(!authorized)return;
    setLoading(true);setError("");
    try{
      if(target==="dashboard"){
        const {data,error:e}=await supabase.rpc("admin_get_dashboard");
        if(e){rpcError(e,"دریافت داشبورد ناموفق بود.");return;} setDashboard(data as Dashboard);
      } else if(target==="shops"){
        const {data,error:e}=await supabase.rpc("admin_get_shops");
        if(e){rpcError(e,"دریافت فروشگاه‌ها ناموفق بود.");return;} setShops(Array.isArray(data)?data:[]);
      } else if(target==="products"){
        const [a,b,c]=await Promise.all([supabase.rpc("admin_get_products"),supabase.rpc("admin_get_categories"),supabase.rpc("admin_get_shops")]);
        if(a.error||b.error||c.error){rpcError(a.error||b.error||c.error,"دریافت داده‌ها ناموفق بود.");return;}
        setProducts(Array.isArray(a.data)?a.data:[]);setCategories(Array.isArray(b.data)?b.data:[]);setShops(Array.isArray(c.data)?c.data:[]);
      } else if(target==="categories"){
        const {data,error:e}=await supabase.rpc("admin_get_categories");
        if(e){rpcError(e,"دریافت دسته‌بندی‌ها ناموفق بود.");return;}setCategories(Array.isArray(data)?data:[]);
      } else if(target==="users"){
        const {data,error:e}=await supabase.rpc("admin_get_users");
        if(e){rpcError(e,"دریافت کاربران ناموفق بود.");return;}setUsers(Array.isArray(data)?data:[]);
      } else {
        const {data,error:e}=await supabase.rpc("admin_get_analytics",{p_days:days});
        if(e){rpcError(e,"دریافت آمار ناموفق بود.");return;}setAnalytics(data as Analytics);
      }
    } finally {setLoading(false);}
  };

  useEffect(()=>{
    let mounted=true;
    supabase.auth.getSession().then(async({data})=>{
      if(!mounted)return;
      setSession(data.session);
      if(data.session){const ok=await ensure();if(ok)await load("dashboard");}
      if(mounted)setBoot(false);
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange(async(_event,next)=>{
      setSession(next);
      if(!next){setAuthorized(false);return;}
      const ok=await ensure();if(ok)await load(section);
    });
    return()=>{mounted=false;subscription.unsubscribe();};
  },[]);

  useEffect(()=>{if(authorized&&section==="analytics")void load("analytics");},[days]);

  const login=async(e:React.FormEvent)=>{e.preventDefault();setAuthBusy(true);setAuthErr("");setAuthMsg("");
    const value=email.trim().toLowerCase();
    const {error:le}=await supabase.auth.signInWithOtp({email:value,options:{emailRedirectTo:window.location.origin+"/admin"}});
    if(le)setAuthErr(le.message);else setAuthMsg("لینک ورود مدیر به ایمیل شما ارسال شد.");
    setAuthBusy(false);
  };

  const open=async(s:Section)=>{setSection(s);setQuery("");setMessage("");setError("");await load(s);};
  const resetShop=()=>{setShopId(null);setShopForm({owner_id:"",shop_name:"",city:"ارومیه",phone:"",instagram:"",logo:"",description:"",latitude:"",longitude:"",status:"active"});};
  const resetProduct=()=>{setProductId(null);setProductForm({shop_id:"",category_id:"",title:"",description:"",weight:"",karat:"18",wage_value:"0",profit_percent:"0",extra_fee:"0",image:"",status:"active"});};
  const resetCategory=()=>{setCategoryId(null);setCategoryForm({name:"",image:"",parent_id:""});};
  const num=(v:string)=>{const cleaned=v.trim();if(!cleaned)return null;const x=Number(cleaned.replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٬،,]/g,""));return Number.isFinite(x)?x:null;};

  const saveShop=async(e:React.FormEvent)=>{e.preventDefault();setMessage("");setError("");
    const {error:e1}=await supabase.rpc("admin_save_shop",{p_id:shopId,p_owner_id:num(shopForm.owner_id),p_shop_name:shopForm.shop_name,p_logo:shopForm.logo,p_description:shopForm.description,p_city:shopForm.city,p_phone:shopForm.phone,p_instagram:shopForm.instagram,p_latitude:num(shopForm.latitude),p_longitude:num(shopForm.longitude),p_status:shopForm.status});
    if(e1){rpcError(e1,"ذخیره فروشگاه ناموفق بود.");return;}setMessage("فروشگاه ذخیره شد.");resetShop();await load("shops");
  };
  const saveProduct=async(e:React.FormEvent)=>{e.preventDefault();setMessage("");setError("");
    const {error:e1}=await supabase.rpc("admin_save_product",{p_id:productId,p_shop_id:num(productForm.shop_id),p_category_id:num(productForm.category_id),p_title:productForm.title,p_description:productForm.description,p_weight:num(productForm.weight),p_karat:num(productForm.karat),p_wage_type:"percent",p_wage_value:num(productForm.wage_value)??0,p_profit_percent:num(productForm.profit_percent)??0,p_extra_fee:num(productForm.extra_fee)??0,p_image:productForm.image,p_status:productForm.status});
    if(e1){rpcError(e1,"ذخیره محصول ناموفق بود.");return;}setMessage("محصول ذخیره شد.");resetProduct();await load("products");
  };
  const saveCategory=async(e:React.FormEvent)=>{e.preventDefault();setMessage("");setError("");
    const {error:e1}=await supabase.rpc("admin_save_category",{p_id:categoryId,p_name:categoryForm.name,p_image:categoryForm.image,p_parent_id:num(categoryForm.parent_id)});
    if(e1){rpcError(e1,"ذخیره دسته‌بندی ناموفق بود.");return;}setMessage("دسته‌بندی ذخیره شد.");resetCategory();await load("categories");
  };
  const role=async(u:User)=>{const next=u.role==="admin"?"seller":"admin";if(!window.confirm(next==="admin"?"کاربر مدیر شود؟":"نقش کاربر به فروشنده تغییر کند؟"))return;
    const {error:e1}=await supabase.rpc("admin_set_user_role",{p_id:u.id,p_role:next});if(e1){rpcError(e1,"تغییر نقش ناموفق بود.");return;}setMessage("نقش کاربر تغییر کرد.");await load("users");
  };

  const filteredShops=useMemo(()=>query?shops.filter(s=>Object.values(s).join(" ").toLowerCase().includes(query.toLowerCase())):shops,[shops,query]);
  const filteredProducts=useMemo(()=>query?products.filter(p=>Object.values(p).join(" ").toLowerCase().includes(query.toLowerCase())):products,[products,query]);
  const filteredCategories=useMemo(()=>query?categories.filter(c=>Object.values(c).join(" ").toLowerCase().includes(query.toLowerCase())):categories,[categories,query]);
  const filteredUsers=useMemo(()=>query?users.filter(u=>Object.values(u).join(" ").toLowerCase().includes(query.toLowerCase())):users,[users,query]);

  if(boot)return <main dir="rtl" className="min-h-screen bg-[#F6F9F7] p-8"><div className="mx-auto max-w-4xl rounded-3xl bg-white p-16 text-center">در حال بررسی دسترسی مدیریت...</div></main>;

  if(!session||!authorized)return <main dir="rtl" className="min-h-screen bg-[#F6F9F7] p-5 md:p-10"><div className="mx-auto grid max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-xl lg:grid-cols-2"><div className="bg-[#173C32] p-8 text-white md:p-10"><div className="text-xs font-black tracking-[.25em] text-[#D3A85A]">THETALA ADMIN</div><h1 className="mt-5 text-4xl font-black">مرکز مدیریت TheTala</h1><p className="mt-5 text-sm leading-8 text-[#DCE9E3]">مدیریت فروشگاه‌ها، محصولات، دسته‌بندی‌ها، کاربران و آمار سایت.</p></div><div className="p-8 md:p-10"><h2 className="text-2xl font-black">ورود مدیر</h2><p className="mt-2 text-sm text-[#71827A]">لینک ورود یک‌بارمصرف به ایمیل حساب مدیر ارسال می‌شود.</p><form onSubmit={login} className="mt-8"><input type="email" dir="ltr" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@example.com" className="h-14 w-full rounded-2xl border px-4 text-sm"/><button disabled={authBusy} className="mt-4 h-14 w-full rounded-2xl bg-[#173C32] text-sm font-black text-white disabled:opacity-60">{authBusy?"در حال ارسال...":"ارسال لینک ورود"}</button></form>{authMsg&&<div className="mt-5 rounded-2xl bg-[#E8F5EE] p-4 text-sm text-[#17633F]">{authMsg}</div>}{authErr||error?<div className="mt-5 rounded-2xl bg-[#FCEBEC] p-4 text-sm text-[#A33C46]">{authErr||error}</div>:null}<Link href="/" className="mt-6 inline-block text-sm font-bold text-[#557267]">← بازگشت به سایت</Link></div></div></main>;

  return <main dir="rtl" className="min-h-screen bg-[#F6F9F7] text-[#173C32]">
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur"><div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between px-4 md:px-8"><div><div className="text-[11px] font-black tracking-[.25em] text-[#A27B17]">THETALA ADMIN</div><div className="mt-1 font-black">مرکز مدیریت</div></div><div className="flex gap-2"><Link href="/admin/market" className="hidden rounded-xl border px-4 py-2.5 text-sm font-bold sm:block">قیمت بازار</Link><Link href="/" className="hidden rounded-xl border px-4 py-2.5 text-sm font-bold md:block">سایت</Link><button onClick={()=>supabase.auth.signOut()} className="rounded-xl border border-[#E9C8CC] px-4 py-2.5 text-sm font-bold text-[#A1444E]">خروج</button></div></div></header>
    <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-4 py-5 md:flex-row md:px-8">
      <aside className="md:w-60 md:shrink-0"><div className="sticky top-24 rounded-3xl border bg-white p-3 shadow-sm"><div className="px-3 py-3 text-xs font-bold text-[#7B8D84]">مدیریت سامانه</div>{nav.map(x=><button key={x.id} onClick={()=>void open(x.id)} className={section===x.id?"mb-1 flex w-full items-center gap-3 rounded-2xl bg-[#173C32] px-3 py-3 text-sm font-black text-white":"mb-1 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-[#50695F] hover:bg-[#F4F8F5]"}><span className="grid h-8 w-8 place-items-center rounded-xl bg-white/10">{x.icon}</span>{x.label}</button>)}</div></aside>
      <section className="min-w-0 flex-1">{message&&<div className="mb-5 rounded-2xl bg-[#EAF7F0] p-4 text-sm font-bold text-[#17633F]">{message}</div>}{error&&<div className="mb-5 rounded-2xl bg-[#FCEBEC] p-4 text-sm font-bold text-[#A33C46]">{error}</div>}{loading&&<div className="mb-5 rounded-2xl bg-white p-4 text-sm font-bold">در حال دریافت اطلاعات...</div>}

      {section==="dashboard"&&<div className="space-y-5"><div className="rounded-3xl bg-[#173C32] p-7 text-white"><div className="text-xs font-black tracking-[.2em] text-[#D3A85A]">CONTROL CENTER</div><h1 className="mt-3 text-3xl font-black">نمای کلی TheTala</h1><p className="mt-3 text-sm leading-7 text-[#DCE9E3]">وضعیت فروشگاه، محصول، کاربر، تعاملات و قیمت بازار.</p></div><div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{[["فروشگاه",dashboard?.shops_total,dashboard?.shops_active],["محصول",dashboard?.products_total,dashboard?.products_active],["کاربر",dashboard?.users_total,dashboard?.sellers_total],["دسته‌بندی",dashboard?.categories_total,null]].map(a=><div key={String(a[0])} className="rounded-3xl border bg-white p-5"><div className="text-xs text-[#82918A]">{a[0]}</div><div className="mt-3 text-3xl font-black">{n(a[1])}</div><div className="mt-2 text-xs text-[#7C8B84]">{a[2]==null?"رکوردهای ثبت‌شده":"فعال/فروشنده: "+n(a[2])}</div></div>)}</div><div className="grid gap-4 lg:grid-cols-2"><div className="rounded-3xl border bg-white p-6"><h3 className="font-black">۳۰ روز گذشته</h3><div className="mt-4 grid grid-cols-2 gap-3">{[["رویداد",dashboard?.events_30d],["بازدید محصول",dashboard?.product_views_30d],["کلیک تماس",dashboard?.contact_clicks_30d],["بازدید فروشگاه",dashboard?.store_views_30d]].map(a=><div key={String(a[0])} className="rounded-2xl bg-[#F7FAF8] p-4"><div className="text-xs text-[#87968F]">{a[0]}</div><div className="mt-2 text-xl font-black">{n(a[1])}</div></div>)}</div></div><div className="rounded-3xl border bg-white p-6"><h3 className="font-black">قیمت طلا</h3><div className="mt-4 text-3xl font-black">{money(dashboard?.market_gold18)}</div><div className="mt-2 text-xs text-[#87968F]">آخرین بروزرسانی: {date(dashboard?.market_updated_at)}</div><Link href="/admin/market" className="mt-5 inline-block text-sm font-black text-[#A17915]">مدیریت قیمت ←</Link></div></div></div>}

      {section==="shops"&&<div className="space-y-5"><div className="rounded-3xl border bg-white p-6"><h2 className="text-2xl font-black">{shopId?"ویرایش فروشگاه":"افزودن فروشگاه"}</h2><form onSubmit={saveShop} className="mt-5 grid gap-3 md:grid-cols-2">{[["shop_name","نام فروشگاه"],["owner_id","شناسه مالک"],["city","شهر"],["phone","تلفن"],["instagram","اینستاگرام"],["logo","آدرس لوگو"],["latitude","Latitude"],["longitude","Longitude"]].map(([k,l])=><input key={k} value={(shopForm as any)[k]} onChange={e=>setShopForm({...shopForm,[k]:e.target.value})} placeholder={l} className="h-12 rounded-xl border px-4 text-sm"/>)}<select value={shopForm.status} onChange={e=>setShopForm({...shopForm,status:e.target.value})} className="h-12 rounded-xl border bg-white px-4 text-sm"><option value="active">فعال</option><option value="inactive">غیرفعال</option></select><textarea value={shopForm.description} onChange={e=>setShopForm({...shopForm,description:e.target.value})} placeholder="توضیحات" className="rounded-xl border px-4 py-3 text-sm md:col-span-2"/><div className="flex gap-2 md:col-span-2"><button className="rounded-xl bg-[#173C32] px-6 py-3.5 text-sm font-black text-white">{shopId?"ذخیره تغییرات":"ثبت فروشگاه"}</button>{shopId&&<button type="button" onClick={resetShop} className="rounded-xl border px-5 py-3.5 text-sm font-bold">انصراف</button>}</div></form></div><div className="rounded-3xl border bg-white"><div className="flex items-center justify-between border-b p-6"><h3 className="text-xl font-black">فروشگاه‌ها</h3><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="جستجو..." className="h-11 rounded-xl border px-4 text-sm md:w-72"/></div><div className="overflow-x-auto"><table className="min-w-[900px] w-full text-right text-sm"><thead className="bg-[#FAFCFB]"><tr><th className="p-4">فروشگاه</th><th className="p-4">مالک</th><th className="p-4">شهر</th><th className="p-4">وضعیت</th><th className="p-4">عملیات</th></tr></thead><tbody>{filteredShops.map(s=><tr key={s.id} className="border-t"><td className="p-4 font-bold">{s.shop_name||"بدون نام"}</td><td className="p-4">{s.owner_name||"—"}<div className="text-xs text-[#87968F]">{s.owner_email||""}</div></td><td className="p-4">{s.city||"—"}</td><td className="p-4"><span className={"rounded-full px-3 py-1.5 text-xs font-bold "+activeClass(s.status)}>{s.status==="active"?"فعال":"غیرفعال"}</span></td><td className="p-4"><button onClick={()=>{setShopId(s.id);setShopForm({owner_id:s.owner_id?String(s.owner_id):"",shop_name:s.shop_name||"",city:s.city||"",phone:s.phone||"",instagram:s.instagram||"",logo:s.logo||"",description:s.description||"",latitude:s.latitude?String(s.latitude):"",longitude:s.longitude?String(s.longitude):"",status:s.status==="inactive"?"inactive":"active"});window.scrollTo({top:0,behavior:"smooth"});}} className="rounded-lg border px-3 py-2 text-xs font-bold">ویرایش</button></td></tr>)}</tbody></table></div></div></div>}

      {section==="products"&&<div className="space-y-5"><div className="rounded-3xl border bg-white p-6"><h2 className="text-2xl font-black">{productId?"ویرایش محصول":"افزودن محصول"}</h2><form onSubmit={saveProduct} className="mt-5 grid gap-3 md:grid-cols-2"><select value={productForm.shop_id} onChange={e=>setProductForm({...productForm,shop_id:e.target.value})} className="h-12 rounded-xl border bg-white px-4 text-sm"><option value="">فروشگاه</option>{shops.map(s=><option key={s.id} value={s.id}>{s.shop_name||"فروشگاه #"+s.id}</option>)}</select><select value={productForm.category_id} onChange={e=>setProductForm({...productForm,category_id:e.target.value})} className="h-12 rounded-xl border bg-white px-4 text-sm"><option value="">بدون دسته‌بندی</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name||"دسته #"+c.id}</option>)}</select><input value={productForm.title} onChange={e=>setProductForm({...productForm,title:e.target.value})} placeholder="عنوان محصول" className="h-12 rounded-xl border px-4 text-sm md:col-span-2"/><input value={productForm.weight} onChange={e=>setProductForm({...productForm,weight:e.target.value})} placeholder="وزن (گرم)" className="h-12 rounded-xl border px-4 text-sm"/><input value={productForm.karat} onChange={e=>setProductForm({...productForm,karat:e.target.value})} placeholder="عیار" className="h-12 rounded-xl border px-4 text-sm"/><input value={productForm.wage_value} onChange={e=>setProductForm({...productForm,wage_value:e.target.value})} placeholder="اجرت (%)" className="h-12 rounded-xl border px-4 text-sm"/><input value={productForm.profit_percent} onChange={e=>setProductForm({...productForm,profit_percent:e.target.value})} placeholder="سود (%)" className="h-12 rounded-xl border px-4 text-sm"/><input value={productForm.extra_fee} onChange={e=>setProductForm({...productForm,extra_fee:e.target.value})} placeholder="هزینه اضافه (تومان)" className="h-12 rounded-xl border px-4 text-sm"/><input value={productForm.image} onChange={e=>setProductForm({...productForm,image:e.target.value})} placeholder="آدرس تصویر" dir="ltr" className="h-12 rounded-xl border px-4 text-sm"/><select value={productForm.status} onChange={e=>setProductForm({...productForm,status:e.target.value})} className="h-12 rounded-xl border bg-white px-4 text-sm"><option value="active">فعال</option><option value="inactive">غیرفعال</option></select><textarea value={productForm.description} onChange={e=>setProductForm({...productForm,description:e.target.value})} placeholder="توضیحات محصول" className="rounded-xl border px-4 py-3 text-sm md:col-span-2"/><div className="flex gap-2 md:col-span-2"><button className="rounded-xl bg-[#173C32] px-6 py-3.5 text-sm font-black text-white">{productId?"ذخیره تغییرات":"ثبت محصول"}</button>{productId&&<button type="button" onClick={resetProduct} className="rounded-xl border px-5 py-3.5 text-sm font-bold">انصراف</button>}</div></form></div><div className="rounded-3xl border bg-white"><div className="flex items-center justify-between border-b p-6"><h3 className="text-xl font-black">محصولات</h3><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="جستجو..." className="h-11 rounded-xl border px-4 text-sm md:w-80"/></div><div className="overflow-x-auto"><table className="min-w-[1100px] w-full text-right text-sm"><thead className="bg-[#FAFCFB]"><tr><th className="p-4">عنوان</th><th className="p-4">فروشگاه</th><th className="p-4">دسته</th><th className="p-4">وزن</th><th className="p-4">عیار</th><th className="p-4">اجرت</th><th className="p-4">وضعیت</th><th className="p-4">عملیات</th></tr></thead><tbody>{filteredProducts.map(p=><tr key={p.id} className="border-t"><td className="p-4 font-bold">{p.title||"بدون عنوان"}</td><td className="p-4">{p.shop_name||"—"}</td><td className="p-4">{p.category_name||"—"}</td><td className="p-4">{p.weight??"—"}</td><td className="p-4">{p.karat??"—"}</td><td className="p-4">{p.wage_value??"—"}٪</td><td className="p-4"><span className={"rounded-full px-3 py-1.5 text-xs font-bold "+activeClass(p.status)}>{p.status==="active"?"فعال":"غیرفعال"}</span></td><td className="p-4"><button onClick={()=>{setProductId(p.id);setProductForm({shop_id:String(p.shop_id),category_id:p.category_id?String(p.category_id):"",title:p.title||"",description:p.description||"",weight:p.weight?String(p.weight):"",karat:p.karat?String(p.karat):"18",wage_value:p.wage_value?String(p.wage_value):"0",profit_percent:p.profit_percent?String(p.profit_percent):"0",extra_fee:p.extra_fee?String(p.extra_fee):"0",image:p.image||"",status:p.status==="inactive"?"inactive":"active"});window.scrollTo({top:0,behavior:"smooth"});}} className="rounded-lg border px-3 py-2 text-xs font-bold">ویرایش</button></td></tr>)}</tbody></table></div></div></div>}

      {section==="categories"&&<div className="space-y-5"><div className="rounded-3xl border bg-white p-6"><h2 className="text-2xl font-black">{categoryId?"ویرایش دسته‌بندی":"افزودن دسته‌بندی"}</h2><form onSubmit={saveCategory} className="mt-5 grid gap-3 md:grid-cols-3"><input value={categoryForm.name} onChange={e=>setCategoryForm({...categoryForm,name:e.target.value})} placeholder="نام دسته‌بندی" className="h-12 rounded-xl border px-4 text-sm"/><input value={categoryForm.image} onChange={e=>setCategoryForm({...categoryForm,image:e.target.value})} placeholder="آدرس تصویر" dir="ltr" className="h-12 rounded-xl border px-4 text-sm"/><select value={categoryForm.parent_id} onChange={e=>setCategoryForm({...categoryForm,parent_id:e.target.value})} className="h-12 rounded-xl border bg-white px-4 text-sm"><option value="">بدون والد</option>{categories.filter(c=>c.id!==categoryId).map(c=><option key={c.id} value={c.id}>{c.name||"دسته #"+c.id}</option>)}</select><div className="flex gap-2 md:col-span-3"><button className="rounded-xl bg-[#173C32] px-6 py-3.5 text-sm font-black text-white">{categoryId?"ذخیره تغییرات":"ثبت دسته‌بندی"}</button>{categoryId&&<button type="button" onClick={resetCategory} className="rounded-xl border px-5 py-3.5 text-sm font-bold">انصراف</button>}</div></form></div><div className="rounded-3xl border bg-white"><div className="flex items-center justify-between border-b p-6"><h3 className="text-xl font-black">دسته‌بندی‌ها</h3><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="جستجو..." className="h-11 rounded-xl border px-4 text-sm md:w-72"/></div>{filteredCategories.map(c=><div key={c.id} className="flex items-center justify-between border-b p-5 last:border-b-0"><div><div className="font-black">{c.name||"بدون نام"}</div><div className="mt-1 text-xs text-[#87968F]">#{c.id}{c.parent_id?" · والد #"+c.parent_id:""}</div></div><button onClick={()=>{setCategoryId(c.id);setCategoryForm({name:c.name||"",image:c.image||"",parent_id:c.parent_id?String(c.parent_id):""})}} className="rounded-lg border px-3 py-2 text-xs font-bold">ویرایش</button></div>)}</div></div>}

      {section==="users"&&<div className="rounded-3xl border bg-white"><div className="flex items-center justify-between border-b p-6"><div><h2 className="text-2xl font-black">کاربران و نقش‌ها</h2><p className="mt-2 text-sm text-[#75857E]">مدیر و فروشنده را از اینجا کنترل کن.</p></div><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="جستجو..." className="h-11 rounded-xl border px-4 text-sm md:w-80"/></div><div className="overflow-x-auto"><table className="min-w-[900px] w-full text-right text-sm"><thead className="bg-[#FAFCFB]"><tr><th className="p-4">کاربر</th><th className="p-4">ایمیل</th><th className="p-4">تلفن</th><th className="p-4">نقش</th><th className="p-4">عملیات</th></tr></thead><tbody>{filteredUsers.map(u=><tr key={u.id} className="border-t"><td className="p-4 font-bold">{u.full_name||"بدون نام"}</td><td className="p-4">{u.email||"—"}</td><td className="p-4">{u.phone||"—"}</td><td className="p-4"><span className="rounded-full bg-[#EEF4FF] px-3 py-1.5 text-xs font-bold">{u.role==="admin"?"مدیر":"فروشنده"}</span></td><td className="p-4"><button onClick={()=>void role(u)} className="rounded-lg border px-3 py-2 text-xs font-bold">{u.role==="admin"?"تبدیل به فروشنده":"تبدیل به مدیر"}</button></td></tr>)}</tbody></table></div></div>}

      {section==="analytics"&&<div className="space-y-5"><div className="rounded-3xl border bg-white p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-black">آمار سایت</h2><p className="mt-2 text-sm text-[#75857E]">عملکرد کل سایت در بازه انتخابی.</p></div><div className="flex gap-2">{[7,30,90].map(d=><button key={d} onClick={()=>setDays(d)} className={days===d?"rounded-xl bg-[#173C32] px-4 py-2.5 text-sm font-black text-white":"rounded-xl border px-4 py-2.5 text-sm font-bold"}>{d===7?"۷ روز":d===30?"۳۰ روز":"۹۰ روز"}</button>)}</div></div></div><div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{[["رویداد",analytics?.summary.events],["بازدید محصول",analytics?.summary.product_views],["کلیک تماس",analytics?.summary.contact_clicks],["بازدید یکتا",analytics?.summary.unique_visitors]].map(a=><div key={String(a[0])} className="rounded-3xl border bg-white p-5"><div className="text-xs text-[#82918A]">{a[0]}</div><div className="mt-3 text-3xl font-black">{n(a[1])}</div></div>)}</div><div className="rounded-3xl border bg-white"><div className="border-b p-6"><h3 className="text-xl font-black">محصولات پربازدید</h3></div>{(analytics?.top_products||[]).map(x=><div key={x.id} className="flex flex-col gap-3 border-b p-5 last:border-b-0 md:flex-row md:items-center md:justify-between"><div><div className="font-black">{x.title||"بدون عنوان"}</div><div className="mt-1 text-xs text-[#87968F]">{x.shop_name||"بدون فروشگاه"}</div></div><div className="flex gap-2"><div className="rounded-xl bg-[#F7FAF8] px-4 py-2 text-center"><div className="text-[10px] text-[#87968F]">بازدید</div><div className="font-black">{n(x.views)}</div></div><div className="rounded-xl bg-[#F7FAF8] px-4 py-2 text-center"><div className="text-[10px] text-[#87968F]">تماس</div><div className="font-black">{n(x.contact_clicks)}</div></div></div></div>)}</div></div>}
      </section>
    </div>
  </main>;
}
