/* DREAM HOUSE — self-contained PDF engine (no external PDF libraries). */
(function(){
  'use strict';
  const A4W=1240,A4H=1754,M=64;
  const COLORS={ink:'#10142a',muted:'#687087',line:'#e7e9ef',accent:'#171c48',soft:'#f5f6fa',white:'#ffffff',green:'#16855b'};
  const money=n=>new Intl.NumberFormat('ar-EG').format(Number(n||0))+' ج.م';
  const escText=v=>String(v??'').replace(/\s+/g,' ').trim();
  function roundRect(ctx,x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  function wrap(ctx,text,maxWidth,font){text=escText(text);if(!text)return [''];ctx.font=font;const words=text.split(' '),lines=[];let line='';for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width<=maxWidth){line=test}else{if(line)lines.push(line);line=word}}if(line)lines.push(line);return lines.length?lines:[''];}
  function textRTL(ctx,text,x,y,maxWidth,font,size,color,weight='400',maxLines=3){ctx.font=`${weight} ${size}px Cairo, Arial, sans-serif`;ctx.fillStyle=color;ctx.direction='rtl';ctx.textAlign='right';ctx.textBaseline='top';const lines=wrap(ctx,text,maxWidth,ctx.font).slice(0,maxLines);const lh=Math.round(size*1.45);lines.forEach((l,i)=>ctx.fillText(l,x,y+i*lh));return lines.length*lh}
  function textLTR(ctx,text,x,y,maxWidth,font,size,color,weight='400'){ctx.font=`${weight} ${size}px Inter, Arial, sans-serif`;ctx.fillStyle=color;ctx.direction='ltr';ctx.textAlign='left';ctx.textBaseline='top';const lines=wrap(ctx,text,maxWidth,ctx.font).slice(0,2);const lh=Math.round(size*1.35);lines.forEach((l,i)=>ctx.fillText(l,x,y+i*lh));}
  function groupOf(x){if(x?.category==='أراضي'||String(x?.type||'').includes('أرض')||x?.type==='أسهم')return 'أراضي';if(['شقة','فيلا'].includes(x?.type))return 'شقق';if(['عمارة','برج','بيت','بيت مشاركة'].includes(x?.type))return 'عمارات';return 'أخرى'}
  function clean(v){return String(v??'').replace(/\s+/g,' ').trim()}
  function has(v){return clean(v)!==''&&clean(v)!=='—'&&clean(v)!=='0'&&clean(v)!=='0.0'}
  function fields(x){const g=groupOf(x), common=[['السعر',x.priceText||money(x.price)],['المساحة',x.sizeText||((x.size||'')+' م²')],['المنطقة',x.area],['الغرض',x.purpose],['الحالة',x.status]];if(g==='أراضي')return common.concat([['الرخصة / الترخيص',x.license],['الصلاحية / القانونية',x.legal],['الواجهة',x.facade],['ناصية',x.corner],['نوع الأرض',x.landUse],['تفاصيل الموقع',x.landLocation]]).filter(f=>has(f[1]));if(g==='شقق')return common.concat([['الدور',x.floor],['البرج / العمارة',x.building],['الأسانسير',x.elevator],['الغرف',has(x.rooms)?x.rooms+' غرف':''],['الحمامات',has(x.baths)?x.baths+' حمام':''],['المطبخ',x.kitchen],['الاستقبال',x.reception],['التشطيب',x.finish],['الرخصة / القانونية',x.apartmentLegal]]).filter(f=>has(f[1]));if(g==='عمارات')return common.concat([['عدد الأدوار',x.floors||x.floor],['الأسانسير',x.buildingElevator],['المحلات',x.shops],['العدادات',x.meters],['الرخصة / الترخيص',x.buildingLicense],['الصلاحية / القانونية',x.buildingLegal],['الواجهة',x.buildingFacade],['ناصية',x.buildingCorner],['الروف / الملحق',x.roof]]).filter(f=>has(f[1]));return common.filter(f=>has(f[1]))}
  function drawPage(kind,items,pageNo,totalPages){
    const c=document.createElement('canvas');c.width=A4W;c.height=A4H;
    const ctx=c.getContext('2d');
    const palette={
      'أراضي':{accent:'#0067FF',soft:'#EEF4FF',badge:'أرض'},
      'شقق':{accent:'#665EFF',soft:'#F1F0FF',badge:'شقة'},
      'عمارات':{accent:'#171C48',soft:'#EEF0F8',badge:'عمارة'},
      'أخرى':{accent:'#353545',soft:'#F1F2F5',badge:'عقار'}
    };
    const drawText=(text,x,y,w,size,color,weight='500',lines=2)=>textRTL(ctx,text,x,y,w,0,size,color,weight,lines);
    const cardGap=18, headerH=154, footerH=70;
    // Site palette: midnight / navy / violet / blue, with coral only as a tiny accent.
    ctx.fillStyle='#F6F7FB';ctx.fillRect(0,0,A4W,A4H);
    ctx.fillStyle='#04061C';ctx.fillRect(0,0,A4W,headerH);
    ctx.fillStyle='#665EFF';ctx.fillRect(0,0,A4W,7);
    ctx.fillStyle='#FF3A63';ctx.fillRect(M,headerH-8,120,3);

    textLTR(ctx,'DREAM HOUSE',M,28,420,0,30,'#FFFFFF','800');
    textLTR(ctx,'Engineer Ahmed Galal  ·  01035032020',M,72,560,0,12,'#B4B4BB','600');
    textRTL(ctx,kind==='clients'?'تقرير العملاء والطلبات':'تقرير العقارات',A4W-M,28,650,0,28,'#FFFFFF','800');
    textRTL(ctx,`الفيوم  ·  ${new Date().toLocaleDateString('ar-EG')}`,A4W-M,72,650,0,13,'#B4B4BB','500');
    drawText(kind==='clients'?'تقرير العملاء والطلبات':'قائمة العقارات',A4W-M,108,500,10,'#B4B4BB','600',1);

    if(kind==='clients'){
      const x=items[0]||{}; const cardX=M, cardY=176, cardW=A4W-2*M, cardH=A4H-cardY-footerH-14;
      ctx.fillStyle='#FFFFFF';roundRect(ctx,cardX,cardY,cardW,cardH,24);ctx.fill();ctx.strokeStyle='#E1E4EE';ctx.lineWidth=2;ctx.stroke();
      drawText(x.name||'عميل',A4W-M-32,cardY+28,cardW-64,25,'#171C48','800',1);
      const fs=[['الهاتف',x.phone],['الطلب',x.type],['الميزانية',money(x.budget)],['المنطقة',x.area||'كل الفيوم'],['الحالة',x.status]].filter(f=>has(f[1]));
      const top=cardY+88, boxW=550, boxH=64, gap=16;
      fs.forEach((f,j)=>{const col=j%2,row=Math.floor(j/2),bx=M+28+col*575,by=top+row*(boxH+gap);ctx.fillStyle='#F5F6FA';roundRect(ctx,bx,by,boxW,boxH,13);ctx.fill();drawText(f[0],bx+boxW-20,by+9,190,11,'#687087','600',1);drawText(f[1],bx+boxW-20,by+31,boxW-44,15,'#10142A','700',2)});
      const detailY=top+Math.ceil(fs.length/2)*(boxH+gap)+22;ctx.fillStyle='#F7F8FC';roundRect(ctx,M+28,detailY,cardW-56,cardH-(detailY-cardY)-26,16);ctx.fill();drawText('ملاحظات',A4W-M-50,detailY+16,cardW-90,13,'#687087','700',1);drawText(x.notes||'لا توجد ملاحظات',A4W-M-50,detailY+48,cardW-90,16,'#10142A','500',10);
    } else {
      const available=A4H-headerH-footerH-30;
      const cardH=Math.floor((available-cardGap*2)/3);
      const cardX=M, cardW=A4W-2*M;
      items.slice(0,3).forEach((x,index)=>{
        const y=headerH+14+index*(cardH+cardGap), g=groupOf(x), pal=palette[g]||palette['أخرى'];
        ctx.save();ctx.shadowColor='rgba(4,6,28,.10)';ctx.shadowBlur=18;ctx.shadowOffsetY=6;ctx.fillStyle='#FFFFFF';roundRect(ctx,cardX,y,cardW,cardH,22);ctx.fill();ctx.restore();
        ctx.strokeStyle='#E0E3EC';ctx.lineWidth=2;roundRect(ctx,cardX,y,cardW,cardH,22);ctx.stroke();
        // Card accent rail
        ctx.fillStyle=pal.accent;roundRect(ctx,cardX,y,7,cardH,4);ctx.fill();
        // Category badge
        ctx.fillStyle=pal.accent;roundRect(ctx,A4W-M-132,y+18,102,34,10);ctx.fill();drawText(pal.badge,A4W-M-46,y+25,70,12,'#FFFFFF','700',1);
        drawText(x.title||'عقار',A4W-M-152,y+16,cardW-184,20,'#171C48','800',1);
        drawText(`${x.area||'—'}  ·  ${x.type||'—'}`,A4W-M-44,y+45,cardW-72,10,'#687087','500',1);
        // Key figures
        const hy=y+70;ctx.fillStyle=pal.soft;roundRect(ctx,M+22,hy,cardW-44,58,14);ctx.fill();
        drawText('السعر',A4W-M-46,hy+8,150,9,'#687087','600',1);drawText(x.priceText||money(x.price),A4W-M-46,hy+26,330,16,'#10142A','800',1);
        drawText('المساحة',M+280,hy+8,150,9,'#687087','600',1);drawText(x.sizeText||((x.size||'')+' م²'),M+280,hy+26,240,15,'#10142A','800',1);
        // Only type-specific fields. Never mix apartment fields into land cards, etc.
        const fs=fields(x).filter(f=>f[0]!=='السعر'&&f[0]!=='المساحة').slice(0,6);
        const top=hy+70, boxW=362, boxH=48, colGap=18, rowGap=9;
        fs.forEach((f,j)=>{const col=j%3,row=Math.floor(j/3),bx=M+22+col*(boxW+colGap),by=top+row*(boxH+rowGap);ctx.fillStyle='#F6F7FA';roundRect(ctx,bx,by,boxW,boxH,10);ctx.fill();drawText(f[0],bx+boxW-14,by+6,145,8,'#687087','600',1);drawText(f[1],bx+boxW-14,by+23,boxW-28,11,'#202333','700',1)});
        const dy=top+2*(boxH+rowGap)+7;
        ctx.fillStyle='#FAFBFD';roundRect(ctx,M+22,dy,cardW-44,cardH-(dy-y)-18,12);ctx.fill();
        drawText('التفاصيل',A4W-M-48,dy+7,cardW-92,9,'#687087','700',1);
        const details=clean(x.desc||'');
        drawText(details||'لا توجد تفاصيل إضافية',A4W-M-48,dy+25,cardW-92,11,details?'#202333':'#9B9BA4','500',3);
      });
    }

    const fy=A4H-48;ctx.strokeStyle='#DCE0EA';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(M,fy);ctx.lineTo(A4W-M,fy);ctx.stroke();
    textLTR(ctx,'DREAM HOUSE  ·  Engineer Ahmed Galal  ·  01035032020',M,fy+10,760,0,10,'#687087','600');
    textLTR(ctx,`Page ${pageNo} / ${totalPages}`,A4W-M-160,fy+10,160,0,10,'#687087','600');
    return c;
  }
  function pdfEscape(s){return String(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');}
  function ascii(s){return new TextEncoder().encode(s)}
  function joinBytes(parts){let n=0;for(const p of parts)n+=p.length;const out=new Uint8Array(n);let o=0;for(const p of parts){out.set(p,o);o+=p.length}return out}
  function buildPDF(jpegs){
    const objects=[];
    const add=(parts)=>{objects.push(parts);return objects.length};
    const catalog=add([]),pages=add([]),pageRefs=[],contentRefs=[],imageRefs=[];
    jpegs.forEach((data,i)=>{
      const b64=data.split(',')[1],bin=atob(b64),bytes=new Uint8Array(bin.length);for(let j=0;j<bin.length;j++)bytes[j]=bin.charCodeAt(j);
      const imgHeader=ascii(`<< /Type /XObject /Subtype /Image /Width ${A4W} /Height ${A4H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`);
      const imgTail=ascii('\nendstream');
      const img=add([imgHeader,bytes,imgTail]);imageRefs.push(img);
      const content=`q\n595.28 0 0 841.89 0 0 cm\n/Im${i+1} Do\nQ`;
      const cr=add([ascii(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)]);contentRefs.push(cr);
      const pr=add([ascii(`<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im${i+1} ${img} 0 R >> >> /Contents ${cr} 0 R >>`)]);pageRefs.push(pr);
    });
    objects[catalog-1]=[ascii(`<< /Type /Catalog /Pages ${pages} 0 R >>`)];
    objects[pages-1]=[ascii(`<< /Type /Pages /Kids [${pageRefs.map(r=>r+' 0 R').join(' ')}] /Count ${pageRefs.length} >>`)];
    const header=ascii('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');let chunks=[header],offsets=[0],pos=header.length;
    objects.forEach((parts,i)=>{const head=ascii(`${i+1} 0 obj\n`),tail=ascii('\nendobj\n');offsets.push(pos);chunks.push(head);pos+=head.length;for(const part of parts){chunks.push(part);pos+=part.length}chunks.push(tail);pos+=tail.length});
    const xrefPos=pos;let xref=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;for(let i=1;i<offsets.length;i++)xref+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';xref+=`trailer\n<< /Size ${objects.length+1} /Root ${catalog} 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
    chunks.push(ascii(xref));return new Blob(chunks,{type:'application/pdf'});
  }
  window.DreamHousePDF={async export(kind,items,filename){const groups=[];for(let i=0;i<items.length;i+=3)groups.push(items.slice(i,i+3));const jpegs=[];for(let i=0;i<groups.length;i++){const c=drawPage(kind,groups[i],i+1,groups.length);jpegs.push(c.toDataURL('image/jpeg',0.92));await new Promise(r=>setTimeout(r,0))}const blob=buildPDF(jpegs);const file=new File([blob],filename,{type:'application/pdf'});if(navigator.share&&navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:filename});return 'shared'}catch(e){if(e?.name==='AbortError')return 'cancelled'}}const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.style.display='none';document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},30000);return 'downloaded'}};
})();
