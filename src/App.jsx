import React, { useState, useRef } from 'react';

const ProductForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    verification: false,
    supplierName: '',
    email: '',
    phone: '',
    brandName: '',
    productType: '',
    productName: '',
    mrp: '',
    transitDays: '',
    oosDays: '',
    skuDetails: {},
    diyType: '',
    coatingType: ''
  });

  const [images, setImages] = useState({ photo1: null, photo2: null, photo3: null, photo4: null });
  const [activeCamera, setActiveCamera] = useState(null);
  const videoRef = useRef(null);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSkuChange = (skuId, field, value) => {
    setFormData(prev => ({
      ...prev,
      skuDetails: {
        ...prev.skuDetails,
        [skuId]: {
          ...(prev.skuDetails[skuId] || {}),
          [field]: value
        }
      }
    }));
  };

  const isStepValid = () => {
    if (step === 1) return formData.verification;
    if (step === 2) return formData.supplierName.trim() && formData.phone.trim();
    if (step === 3) return formData.brandName.trim() && formData.productType && formData.productName.trim();
    if (step === 4) {
      const selectedSkus = Object.entries(formData.skuDetails).filter(([_, s]) => s.selected);
      if (selectedSkus.length === 0) return false;
      return selectedSkus.every(([_, s]) => s.price && s.qty);
    }
    return true;
  };

  const handleImageUpload = (slot, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => ({ ...prev, [slot]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async (slot) => {
    setActiveCamera(slot);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error: ", err);
      alert("Camera access failed.");
      setActiveCamera(null);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    setImages(prev => ({ ...prev, [activeCamera]: dataUrl }));
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
    }
    setActiveCamera(null);
  };

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setActiveCamera(null);
  };

  const IconUpload = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
  );

  const Tooltip = ({ title, desc }) => (
    <div className="tooltip-wrapper">
      <span className="info-icon">i</span>
      <div className="tooltip-content">
        <strong style={{ display: 'block', marginBottom: '4px', color: '#0f172a' }}>{title}</strong>
        {desc}
      </div>
    </div>
  );

  const units = ["Metres (m)", "Centimetres (cm)", "Inches", "Feet", "Millimetres (mm)"];

  const renderVerification = () => (
    <div className="form-section">
      <header className="step-header">
        <h2 className="step-title">Initial Verification</h2>
        <p className="step-desc">Before starting, please confirm you have the physical product and documentation ready for accurate data entry.</p>
      </header>
      <div className="warning-panel">
        <p><strong>Note:</strong> Product details must match labels and official documentation exactly to avoid confusion or rejection during review.</p>
      </div>
      <label className="custom-checkbox">
        <input type="checkbox" name="verification" style={{ display: 'none' }} checked={formData.verification} onChange={handleInputChange} />
        <div className="checkbox-visual">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <span className="checkbox-label">I have the product in front of me and am ready to proceed</span>
      </label>
      <div className="button-group single-btn">
        <button className="btn-primary" disabled={!formData.verification} onClick={nextStep}>
          Get Started 
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </div>
    </div>
  );

  const renderSupplierInfo = () => (
    <div className="form-section">
      <header className="step-header"><h2 className="step-title">Supplier Information</h2><p className="step-desc">Provide your GST-registered company details exactly as they appear on your certificate.</p></header>
      <div className="form-group"><label className="form-label">Company Name <span style={{color:'var(--error)'}}>*</span></label><input name="supplierName" className="input-field" placeholder="e.g. PlushMyRide Distribution Pvt Ltd" value={formData.supplierName} onChange={handleInputChange} required /></div>
      <div className="form-grid">
        <div className="form-group"><label className="form-label">Official Email</label><input type="email" name="email" className="input-field" placeholder="office@company.com" value={formData.email} onChange={handleInputChange} /></div>
        <div className="form-group"><label className="form-label">Contact Number <span style={{color:'var(--error)'}}>*</span></label><input name="phone" className="input-field" placeholder="+91 98765 43210" value={formData.phone} onChange={handleInputChange} required /></div>
      </div>
      <div className="button-group"><button className="btn-secondary" onClick={prevStep}>Back</button><button className="btn-primary" onClick={nextStep} disabled={!isStepValid()}>Continue</button></div>
    </div>
  );

  const renderProductIdentification = () => (
    <div className="form-section">
      <header className="step-header"><h2 className="step-title">Product Identity</h2><p className="step-desc">Select the category and define the primary brand identity of the product.</p></header>
      <div className="form-grid">
        <div className="form-group"><label className="form-label">Brand Name <span style={{color:'var(--error)'}}>*</span></label><input name="brandName" className="input-field" placeholder="3M, Garware, Avery, etc." value={formData.brandName} onChange={handleInputChange} required /></div>
        <div className="form-group">
          <label className="form-label">Category <span style={{color:'var(--error)'}}>*</span></label>
          <select name="productType" className="input-field select-field" value={formData.productType} onChange={handleInputChange} required>
            <option value="">Select Category</option>
            <option value="PPF">PPF</option>
            <option value="Sunfilm">Sunfilm</option>
            <option value="Coating">Coating</option>
            <option value="DIY">DIY</option>
          </select>
        </div>
      </div>
      <div className="form-group"><label className="form-label">Primary Product Name <span style={{color:'var(--error)'}}>*</span></label><input name="productName" className="input-field" placeholder="e.g. Crystal Shield Ultra Series" value={formData.productName} onChange={handleInputChange} required /></div>
      <div className="button-group"><button className="btn-secondary" onClick={prevStep}>Back</button><button className="btn-primary" onClick={nextStep} disabled={!isStepValid()}>Next: SKU Details</button></div>
    </div>
  );

  const renderSKUDetails = () => (
    <div className="form-section">
      <header className="step-header">
        <h2 className="step-title">{formData.productType} SKU Configuration</h2>
        <p className="step-desc">Define exact specifications, dimensions, and variants for your product line.</p>
      </header>

      <div className="sku-logic-scroll" style={{ maxHeight: '480px', overflowY: 'auto', paddingRight: '1rem', marginBottom: '1.5rem' }}>
        
        {formData.productType === 'PPF' && (
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--card-border)' }}>
            <label className="custom-checkbox" style={{ padding: 0, marginBottom: '2rem' }}>
              <input type="checkbox" style={{ display: 'none' }} defaultChecked />
              <div className="checkbox-visual"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
              <span className="checkbox-label" style={{ fontWeight: 700, fontSize: '1.25rem', color: '#fff' }}>Full Roll [Optional]</span>
            </label>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Length</label><input className="input-field" type="number" placeholder="Value" /></div>
              <div className="form-group"><label className="form-label">Unit</label><select className="input-field select-field">{units.map(u => <option key={u}>{u}</option>)}</select></div>
            </div>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Width</label><input className="input-field" type="number" placeholder="Value" /></div>
              <div className="form-group"><label className="form-label">Unit</label><select className="input-field select-field">{units.map(u => <option key={u}>{u}</option>)}</select></div>
            </div>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Price to PMD (₹)</label><input className="input-field" type="number" placeholder="₹" /></div>
              <div className="form-group"><label className="form-label">Qty in Stock</label><input className="input-field" type="number" placeholder="Qty" /></div>
            </div>
          </div>
        )}

        {formData.productType === 'Sunfilm' && (
          <div>
            {[
              { id: 'fullRoll', label: 'Full Roll', hasDim: true },
              { id: 'fwsPack', label: 'Front Windshield (FWS) Pack' },
              { id: 'hatchback', label: 'Full Car Pack - Hatchback' },
              { id: 'sedan', label: 'Full Car Pack - Sedan' },
              { id: 'suv', label: 'Full Car Pack - SUV' },
              { id: 'sunroofSingle', label: 'Sunroof - Single Roof', hasDim: true },
              { id: 'sunroofDouble', label: 'Sunroof - Double Pack', info: '2 pieces × 30" × 30" each' }
            ].map(sku => (
              <div key={sku.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--card-border)', marginBottom: '1.25rem' }}>
                <label className="custom-checkbox" style={{ padding: 0, margin: 0 }}>
                  <input type="checkbox" style={{ display: 'none' }} checked={formData.skuDetails[sku.id]?.selected} onChange={(e) => setFormData(prev => ({ ...prev, skuDetails: { ...prev.skuDetails, [sku.id]: { selected: e.target.checked } } }))} />
                  <div className="checkbox-visual"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
                  <span className="checkbox-label" style={{ fontWeight: 700, color: '#fff' }}>{sku.label}</span>
                </label>
                {formData.skuDetails[sku.id]?.selected && (
                  <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--card-border)', paddingTop: '1.25rem' }}>
                    {sku.info && <p style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem', marginBottom: '1rem', fontWeight: 600 }}>ⓘ {sku.info}</p>}
                    {sku.hasDim && (
                      <div className="form-grid">
                        <div className="form-group"><label className="form-label">Dimensions</label><div style={{ display: 'flex', gap: '0.75rem' }}><input className="input-field" type="number" placeholder="L" /><input className="input-field" type="number" placeholder="W" /></div></div>
                        <div className="form-group"><label className="form-label">Unit</label><select className="input-field select-field">{units.map(u => <option key={u}>{u}</option>)}</select></div>
                      </div>
                    )}
                    <div className="form-grid">
                      <div className="form-group"><label className="form-label">Price (₹) <span style={{color:'var(--error)'}}>*</span></label><input className="input-field" type="number" placeholder="₹" value={formData.skuDetails[sku.id]?.price || ''} onChange={(e) => handleSkuChange(sku.id, 'price', e.target.value)} required /></div>
                      <div className="form-group"><label className="form-label">Qty <span style={{color:'var(--error)'}}>*</span></label><input className="input-field" type="number" placeholder="Stock" value={formData.skuDetails[sku.id]?.qty || ''} onChange={(e) => handleSkuChange(sku.id, 'qty', e.target.value)} required /></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {formData.productType === 'Coating' && (
          <div>
            <div className="form-group">
              <label className="form-label">Coating Type</label>
              <select name="coatingType" className="input-field select-field" value={formData.coatingType} onChange={handleInputChange}>
                <option value="">Select Type</option>
                <option>Ceramic</option>
                <option>Graphene</option>
                <option>Borophene</option>
              </select>
            </div>
            {['30ml', '50ml', '100ml'].map(size => (
              <div key={size} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--card-border)', marginBottom: '1.25rem' }}>
                <label className="custom-checkbox" style={{ padding: 0, margin: 0 }}>
                  <input type="checkbox" style={{ display: 'none' }} checked={formData.skuDetails[size]?.selected} onChange={(e) => setFormData(prev => ({ ...prev, skuDetails: { ...prev.skuDetails, [size]: { selected: e.target.checked } } }))} />
                  <div className="checkbox-visual"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
                  <span className="checkbox-label" style={{ fontWeight: 700, color: '#fff' }}>{size} Variant</span>
                </label>
                {formData.skuDetails[size]?.selected && (
                  <div style={{ marginTop: '1.25rem' }}>
                    <div className="form-group"><label className="form-label">Package Type</label><select className="input-field select-field"><option>Kit (includes towel, manual, etc.)</option><option>Bottle (standalone)</option></select></div>
                    <div className="form-grid">
                      <div className="form-group"><label className="form-label">Price (₹)</label><input className="input-field" type="number" placeholder="₹" /></div>
                      <div className="form-group"><label className="form-label">Qty</label><input className="input-field" type="number" placeholder="Qty" /></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {formData.productType === 'DIY' && (
          <div>
            <div className="form-group">
              <label className="form-label">DIY Product Type</label>
              <select name="diyType" className="input-field select-field" value={formData.diyType} onChange={handleInputChange}>
                <option value="">Select Type</option>
                {['Car Shampoo', 'Car Wax / Polish (Liquid)', 'Car Wax / Polish (Solid)', 'Glass Cleaner', 'Tyre Shine', 'Dashboard Dresser', 'Quick Detailer', 'Wheel Cleaner', 'Interior Cleaner', 'Tar Remover', 'Leather Conditioner', 'Trim Restorer', 'Microfibre Cloth', 'Clay Bar', 'Foam Mitt', 'Detailing Brush', 'Applicator Pad', 'Engine Degreaser', 'Fabric Protectant', 'Headlight Kit', 'Ceramic DIY Kit', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {formData.diyType && (() => {
              let sizes = ['100ml', '250ml', '500ml', '750ml', '1L', '5L'];
              if (formData.diyType === 'Microfibre Cloth') sizes = ['1 Piece', '3 Pack', '5 Pack', '10 Pack', 'Other Pack'];
              else if (formData.diyType.includes('Brush') || formData.diyType.includes('Mitt')) sizes = ['1 Piece', 'Set'];
              return sizes.map(size => (
                <div key={size} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '15px', border: '1px solid var(--card-border)', marginBottom: '1rem' }}>
                  <label className="custom-checkbox" style={{ padding: 0, margin: 0 }}>
                    <input type="checkbox" style={{ display: 'none' }} checked={formData.skuDetails[`${formData.diyType}-${size}`]?.selected} onChange={(e) => setFormData(prev => ({ ...prev, skuDetails: { ...prev.skuDetails, [`${formData.diyType}-${size}`]: { selected: e.target.checked } } }))} />
                    <div className="checkbox-visual"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
                    <span className="checkbox-label" style={{ fontWeight: 600 }}>{size}</span>
                  </label>
                  {formData.skuDetails[`${formData.diyType}-${size}`]?.selected && (
                    <div className="form-grid" style={{ marginTop: '1rem' }}>
                      <div className="form-group" style={{ margin: 0 }}><label className="form-label">Price (₹) <span style={{color:'var(--error)'}}>*</span></label><input className="input-field" type="number" placeholder="₹" value={formData.skuDetails[`${formData.diyType}-${size}`]?.price || ''} onChange={(e) => handleSkuChange(`${formData.diyType}-${size}`, 'price', e.target.value)} required /></div>
                      <div className="form-group" style={{ margin: 0 }}><label className="form-label">Qty <span style={{color:'var(--error)'}}>*</span></label><input className="input-field" type="number" placeholder="Qty" value={formData.skuDetails[`${formData.diyType}-${size}`]?.qty || ''} onChange={(e) => handleSkuChange(`${formData.diyType}-${size}`, 'qty', e.target.value)} required /></div>
                      <div className="form-group" style={{ margin: 0 }}><label className="form-label">Dimensions <span style={{color:'var(--error)'}}>*</span></label><input className="input-field" type="text" placeholder="L x W" value={formData.skuDetails[`${formData.diyType}-${size}`]?.dimension || ''} onChange={(e) => handleSkuChange(`${formData.diyType}-${size}`, 'dimension', e.target.value)} required /></div>
                    </div>
                  )}
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      <div className="button-group">
        <button className="btn-secondary" onClick={prevStep}>Back</button>
        <button className="btn-primary" onClick={nextStep}>Next: Media & Logistics</button>
      </div>
    </div>
  );

  const renderLogistics = () => (
    <div className="form-section">
      {activeCamera && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ width: '100%', maxWidth: '640px', borderRadius: '30px', overflow: 'hidden', border: '4px solid var(--primary)', position: 'relative' }}>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', transform: 'scaleX(-1)' }} />
          </div>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <button onClick={closeCamera} className="btn-secondary" style={{ width: 'auto', padding: '0 2.5rem' }}>Cancel</button>
            <button onClick={capturePhoto} style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'white', border: '8px solid var(--primary)', cursor: 'pointer' }} />
          </div>
        </div>
      )}

      <header className="step-header"><h2 className="step-title">Media & Logistics</h2><p className="step-desc">Finalize the submission with transit timelines and required verification photos.</p></header>
      
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">
            Transit (In Stock) <Tooltip title="Transit Timeline" desc="Days to deliver if product is currently in your stock." />
          </label>
          <input type="number" name="transitDays" className="input-field" placeholder="Days" value={formData.transitDays} onChange={handleInputChange} />
        </div>
        <div className="form-group">
          <label className="form-label">
            Procurement (OOS) <Tooltip title="Backorder Timeline" desc="Days to procure from manufacturer and deliver if OOS." />
          </label>
          <input type="number" name="oosDays" className="input-field" placeholder="Days" value={formData.oosDays} onChange={handleInputChange} />
        </div>
      </div>

      <div className="form-group" style={{ marginTop: '1rem' }}>
        <label className="form-label" style={{ marginBottom: '1.5rem' }}>Verification Photos (4 Required)</label>
        <div className="photo-grid">
          {[
            { id: 'photo1', label: 'Photo 1', hint: 'Front / Label Side' },
            { id: 'photo2', label: 'Photo 2', hint: 'Back / Spec Side' },
            { id: 'photo3', label: 'Photo 3', hint: 'Left Side / Roll End' },
            { id: 'photo4', label: 'Photo 4', hint: 'Actual Product / Sample' }
          ].map(slot => (
            <div key={slot.id} className="photo-slot">
              <input type="file" id={slot.id} style={{ display: 'none' }} accept="image/*" onChange={(e) => handleImageUpload(slot.id, e)} />
              {images[slot.id] ? (
                <div className="photo-preview-container">
                  <img src={images[slot.id]} alt="Preview" />
                  <button onClick={() => setImages(prev => ({ ...prev, [slot.id]: null }))} style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--error)', border: 'none', color: 'white', width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>×</button>
                </div>
              ) : (
                <div className="photo-placeholder"><IconUpload /></div>
              )}
              <div style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.25rem' }}>{slot.label}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.4', padding: '0 1rem' }}>{slot.hint}</div>
              <div style={{ display: 'flex', gap: '0.5rem', padding: '0 0.5rem' }}>
                <button className="btn-secondary" style={{ flex: 1, height: '40px', fontSize: '0.75rem' }} onClick={() => document.getElementById(slot.id).click()}>Upload</button>
                <button className="btn-primary" style={{ flex: 1, height: '40px', fontSize: '0.75rem', boxShadow: 'none' }} onClick={() => startCamera(slot.id)}>Capture</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="button-group">
        <button className="btn-secondary" onClick={prevStep}>Back</button>
        <button className="btn-primary" style={{ background: 'var(--success)' }}>Complete Submission</button>
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <header className="portal-header">
        <h1 className="portal-logo">PlushMyRide</h1>
        <p className="portal-subtitle">Supplier Management Portal</p>
        <div className="progress-bar">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`progress-pill ${i === step ? 'active' : (i < step ? 'done' : '')}`} />
          ))}
        </div>
      </header>
      <main className="form-container">
        <div className="glass-card">
          {step === 1 && renderVerification()}
          {step === 2 && renderSupplierInfo()}
          {step === 3 && renderProductIdentification()}
          {step === 4 && renderSKUDetails()}
          {step === 5 && renderLogistics()}
        </div>
      </main>
    </div>
  );
};

export default ProductForm;
