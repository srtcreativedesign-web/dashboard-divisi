export function WorkflowGuide({kind}:{kind:'omzet'|'voucher'|'setoran'}) {
 const steps=kind==='setoran'?['Admin mencatat setoran','Finance mencatat penerimaan','Accounting mencocokkan sumber']:['Admin membuat dan mengajukan', 'Accounting memeriksa',kind==='omzet'?'Validasi atau keputusan Manager':'Manager menyetujui'];
 return <section aria-label="Alur pekerjaan" className="rounded-card border border-line bg-white px-4 py-3"><ol className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">{steps.map((step,i)=><li key={step} className="flex items-center gap-2"><span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-semibold text-navy">{i+1}</span>{step}</li>)}</ol></section>;
}
