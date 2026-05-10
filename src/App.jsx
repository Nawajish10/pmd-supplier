import React, { useState, useRef } from 'react';

const ProductForm = () => {
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState([]);
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
    diyTypeOther: '',
    stockStatus: 'in_stock'
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleAddAnotherProduct = () => {
    const currentProduct = {
      brandName: formData.brandName,
      productType: formData.productType,
      productName: formData.productName,
      diyType: formData.diyType,
      diyTypeOther: formData.diyTypeOther,
      coatingType: formData.coatingType,
      skuDetails: formData.skuDetails,
      stockStatus: formData.stockStatus,
      transitDays: formData.transitDays,
      oosDays: formData.oosDays
    };
    
    setProducts(prev => [...prev, currentProduct]);
    
    setFormData(prev => ({
      ...prev,
      brandName: '',
      productType: '',
      productName: '',
      mrp: '',
      transitDays: '',
      oosDays: '',
      skuDetails: {},
      diyType: '',
      diyTypeOther: '',
      coatingType: '',
      stockStatus: 'in_stock'
    }));
    
    setStep(3); // Go back to Product Identity
  };

  const handleEditProduct = (index) => {
    const productToEdit = products[index];
    if (formData.brandName.trim() !== '') {
      if (!window.confirm("You have unsaved changes for the current product. Are you sure you want to edit a queued product? Your current progress will be lost.")) {
        return;
      }
    }
    setFormData(prev => ({
      ...prev,
      brandName: productToEdit.brandName,
      productType: productToEdit.productType,
      productName: productToEdit.productName,
      diyType: productToEdit.diyType,
      diyTypeOther: productToEdit.diyTypeOther,
      coatingType: productToEdit.coatingType,
      skuDetails: productToEdit.skuDetails,
      stockStatus: productToEdit.stockStatus,
      transitDays: productToEdit.transitDays,
      oosDays: productToEdit.oosDays
    }));
    setProducts(prev => prev.filter((_, i) => i !== index));
    setStep(3);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const finalProduct = {
      brandName: formData.brandName,
      productType: formData.productType,
      productName: formData.productName,
      diyType: formData.diyType,
      diyTypeOther: formData.diyTypeOther,
      coatingType: formData.coatingType,
      skuDetails: formData.skuDetails,
      stockStatus: formData.stockStatus,
      transitDays: formData.transitDays,
      oosDays: formData.oosDays
    };

    const allProducts = [...products, finalProduct];

    const payload = {
      Timestamp: new Date().toLocaleString(),
      SupplierName: formData.supplierName,
      Email: formData.email,
      Phone: `+91${formData.phone}`,
      Products: allProducts.map(p => {
        const selectedSkus = Object.entries(p.skuDetails)
          .filter(([id, s]) => p.productType === 'PPF' ? true : s.selected)
          .map(([id, s]) => `${id} (Price: ₹${s.price || 0}, Qty: ${s.qty || 0}${s.dimension ? `, Dim: ${s.dimension}${s.unit ? ' ' + s.unit : ''}` : ''}${s.length ? `, Dim: ${s.length}${s.lengthUnit || ''} x ${s.width || ''}${s.widthUnit || ''}` : ''}${s.packageType ? `, Pkg: ${s.packageType}` : ''})`)
          .join(' | ');

        return {
          BrandName: p.brandName,
          Category: p.productType,
          ProductName: p.productName || 'N/A',
          DIYType: p.diyType === 'Other' ? `Other: ${p.diyTypeOther}` : p.diyType || 'N/A',
          CoatingType: p.coatingType || 'N/A',
          SKUDetails: selectedSkus,
          StockStatus: p.stockStatus === 'in_stock' ? 'In Stock' : 'Out of Stock',
          TransitDays: p.stockStatus === 'in_stock' ? (p.transitDays || '-') : '-',
          OOSDays: p.stockStatus === 'out_of_stock' ? (p.oosDays || '-') : '-'
        };
      })
    };

    try {
      const WEBHOOK_URL = "https://primary-production-e2862c.up.railway.app/webhook/pmd-supplier-data"; 
      
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
      
      setIsSubmitted(true);
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Failed to submit form. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
    if (step === 2) {
      const isEmailValid = formData.email ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) : false;
      const isPhoneValid = formData.phone.length === 10;
      return formData.supplierName.trim() && isEmailValid && isPhoneValid;
    }
    if (step === 3) {
      if (!formData.brandName.trim() || !formData.productType) return false;
      if (formData.productType !== 'DIY' && formData.productType !== 'Coating' && (!formData.productName || !formData.productName.trim())) return false;
      if (formData.productType === 'DIY') {
        if (!formData.diyType) return false;
        if (formData.diyType === 'Other' && (!formData.diyTypeOther || !formData.diyTypeOther.trim())) return false;
      }
      if (formData.productType === 'Coating') {
        if (!formData.coatingType) return false;
      }
      return true;
    }
    if (step === 4) {
      if (formData.productType === 'PPF') {
        const ppf = formData.skuDetails['PPF-Roll'];
        if (!ppf) return false;
        return !!(ppf.price && ppf.qty);
      }
      const selectedSkus = Object.entries(formData.skuDetails).filter(([_, s]) => s.selected);
      if (selectedSkus.length === 0) return false;
      return selectedSkus.every(([_, s]) => s.price && s.qty);
    }
    return true;
  };


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
        <span className="checkbox-label">I have the product details</span>
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
        <div className="form-group"><label className="form-label">Official Email <span style={{color:'var(--error)'}}>*</span></label><input type="email" name="email" className="input-field" placeholder="office@company.com" value={formData.email} onChange={handleInputChange} required /></div>
        <div className="form-group">
          <label className="form-label">Contact Number <span style={{color:'var(--error)'}}>*</span></label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'absolute', left: '1.5rem', color: 'var(--text-secondary)', fontWeight: '600', pointerEvents: 'none' }}>+91</div>
            <input 
              type="tel" 
              name="phone" 
              className="input-field" 
              style={{ paddingLeft: '3.5rem' }} 
              placeholder="9876543210" 
              value={formData.phone} 
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                if (val.length <= 10) handleInputChange({ target: { name: 'phone', type: 'text', checked: false, value: val } });
              }} 
              required 
            />
          </div>
        </div>
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
      {formData.brandName.trim() !== '' && formData.productType !== '' && formData.productType !== 'DIY' && formData.productType !== 'Coating' && (
        <div className="form-group"><label className="form-label">Primary Product Name <span style={{color:'var(--error)'}}>*</span></label><input name="productName" className="input-field" placeholder="e.g. Crystal Shield Ultra Series" value={formData.productName} onChange={handleInputChange} required /></div>
      )}
      {formData.brandName.trim() !== '' && formData.productType === 'DIY' && (
        <>
          <div className="form-group">
            <label className="form-label">DIY Product Type <span style={{color:'var(--error)'}}>*</span></label>
            <select name="diyType" className="input-field select-field" value={formData.diyType} onChange={handleInputChange} required>
              <option value="">Select Type</option>
              {['Car Shampoo', 'Car Wax / Polish (Liquid)', 'Car Wax / Polish (Solid)', 'Glass Cleaner', 'Tyre Shine', 'Dashboard Dresser', 'Quick Detailer', 'Wheel Cleaner', 'Interior Cleaner', 'Tar Remover', 'Leather Conditioner', 'Trim Restorer', 'Microfibre Cloth', 'Clay Bar', 'Foam Mitt', 'Detailing Brush', 'Applicator Pad', 'Engine Degreaser', 'Fabric Protectant', 'Headlight Kit', 'Ceramic DIY Kit', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {formData.diyType === 'Other' && (
            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label className="form-label">Specify DIY Type <span style={{color:'var(--error)'}}>*</span></label>
              <textarea name="diyTypeOther" className="input-field" placeholder="Describe the DIY product..." value={formData.diyTypeOther} onChange={handleInputChange} style={{ height: '80px', paddingTop: '1rem', resize: 'vertical' }} required></textarea>
            </div>
          )}
        </>
      )}
      {formData.brandName.trim() !== '' && formData.productType === 'Coating' && (
        <div className="form-group">
          <label className="form-label">Coating Type <span style={{color:'var(--error)'}}>*</span></label>
          <select name="coatingType" className="input-field select-field" value={formData.coatingType} onChange={handleInputChange} required>
            <option value="">Select Type</option>
            <option>Ceramic</option>
            <option>Graphene</option>
            <option>Borophene</option>
          </select>
        </div>
      )}
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
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#fff', fontSize: '1.25rem' }}>Full Roll Configuration</h3>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Length</label><input className="input-field" type="number" placeholder="Value" value={formData.skuDetails['PPF-Roll']?.length || ''} onChange={(e) => handleSkuChange('PPF-Roll', 'length', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Unit</label><select className="input-field select-field" value={formData.skuDetails['PPF-Roll']?.lengthUnit || ''} onChange={(e) => handleSkuChange('PPF-Roll', 'lengthUnit', e.target.value)}><option value="">Select</option>{units.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
            </div>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Width</label><input className="input-field" type="number" placeholder="Value" value={formData.skuDetails['PPF-Roll']?.width || ''} onChange={(e) => handleSkuChange('PPF-Roll', 'width', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Unit</label><select className="input-field select-field" value={formData.skuDetails['PPF-Roll']?.widthUnit || ''} onChange={(e) => handleSkuChange('PPF-Roll', 'widthUnit', e.target.value)}><option value="">Select</option>{units.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
            </div>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Price to PMD (₹) <span style={{color:'var(--error)'}}>*</span></label><input className="input-field" type="number" placeholder="₹" value={formData.skuDetails['PPF-Roll']?.price || ''} onChange={(e) => handleSkuChange('PPF-Roll', 'price', e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Qty in Stock <span style={{color:'var(--error)'}}>*</span></label><input className="input-field" type="number" placeholder="Qty" value={formData.skuDetails['PPF-Roll']?.qty || ''} onChange={(e) => handleSkuChange('PPF-Roll', 'qty', e.target.value)} required /></div>
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
                        <div className="form-group"><label className="form-label">Dimensions</label><div style={{ display: 'flex', gap: '0.75rem' }}><input className="input-field" type="number" placeholder="L" value={formData.skuDetails[sku.id]?.length || ''} onChange={(e) => handleSkuChange(sku.id, 'length', e.target.value)} /><input className="input-field" type="number" placeholder="W" value={formData.skuDetails[sku.id]?.width || ''} onChange={(e) => handleSkuChange(sku.id, 'width', e.target.value)} /></div></div>
                        <div className="form-group"><label className="form-label">Unit</label><select className="input-field select-field" value={formData.skuDetails[sku.id]?.unit || ''} onChange={(e) => handleSkuChange(sku.id, 'unit', e.target.value)}><option value="">Select</option>{units.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
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
            {['30ml', '50ml', '100ml'].map(size => (
              <div key={size} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--card-border)', marginBottom: '1.25rem' }}>
                <label className="custom-checkbox" style={{ padding: 0, margin: 0 }}>
                  <input type="checkbox" style={{ display: 'none' }} checked={formData.skuDetails[size]?.selected} onChange={(e) => setFormData(prev => ({ ...prev, skuDetails: { ...prev.skuDetails, [size]: { selected: e.target.checked } } }))} />
                  <div className="checkbox-visual"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
                  <span className="checkbox-label" style={{ fontWeight: 700, color: '#fff' }}>{size} Variant</span>
                </label>
                {formData.skuDetails[size]?.selected && (
                  <div style={{ marginTop: '1.25rem' }}>
                    <div className="form-group"><label className="form-label">Package Type</label><select className="input-field select-field" value={formData.skuDetails[size]?.packageType || ''} onChange={(e) => handleSkuChange(size, 'packageType', e.target.value)}><option value="Kit">Kit (includes towel, manual, etc.)</option><option value="Bottle">Bottle (standalone)</option></select></div>
                    <div className="form-grid">
                      <div className="form-group"><label className="form-label">Price (₹) <span style={{color:'var(--error)'}}>*</span></label><input className="input-field" type="number" placeholder="₹" value={formData.skuDetails[size]?.price || ''} onChange={(e) => handleSkuChange(size, 'price', e.target.value)} required /></div>
                      <div className="form-group"><label className="form-label">Qty <span style={{color:'var(--error)'}}>*</span></label><input className="input-field" type="number" placeholder="Qty" value={formData.skuDetails[size]?.qty || ''} onChange={(e) => handleSkuChange(size, 'qty', e.target.value)} required /></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {formData.productType === 'DIY' && (
          <div>
            {formData.diyType && (() => {
              let sizes = ['100ml', '250ml', '500ml', '750ml', '1L', '5L'];
              if (formData.diyType === 'Microfibre Cloth') sizes = ['1 Piece', '3 Pack', '5 Pack', '10 Pack', 'Other Pack'];
              else if (formData.diyType.includes('Brush') || formData.diyType.includes('Mitt')) sizes = ['1 Piece', 'Set'];
              else if (formData.diyType === 'Other') sizes = ['Custom Variant'];
              return sizes.map(size => (
                <div key={size} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '15px', border: '1px solid var(--card-border)', marginBottom: '1rem' }}>
                  <label className="custom-checkbox" style={{ padding: 0, margin: 0 }}>
                    <input type="checkbox" style={{ display: 'none' }} checked={formData.skuDetails[`${formData.diyType}-${size}`]?.selected} onChange={(e) => setFormData(prev => ({ ...prev, skuDetails: { ...prev.skuDetails, [`${formData.diyType}-${size}`]: { selected: e.target.checked } } }))} />
                    <div className="checkbox-visual"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
                    <span className="checkbox-label" style={{ fontWeight: 600 }}>{size}</span>
                  </label>
                  {formData.skuDetails[`${formData.diyType}-${size}`]?.selected && (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
                      <div className="form-grid">
                        <div className="form-group" style={{ margin: 0 }}><label className="form-label">Price (₹) <span style={{color:'var(--error)'}}>*</span></label><input className="input-field" type="number" placeholder="₹" value={formData.skuDetails[`${formData.diyType}-${size}`]?.price || ''} onChange={(e) => handleSkuChange(`${formData.diyType}-${size}`, 'price', e.target.value)} required /></div>
                        <div className="form-group" style={{ margin: 0 }}><label className="form-label">Qty <span style={{color:'var(--error)'}}>*</span></label><input className="input-field" type="number" placeholder="Qty" value={formData.skuDetails[`${formData.diyType}-${size}`]?.qty || ''} onChange={(e) => handleSkuChange(`${formData.diyType}-${size}`, 'qty', e.target.value)} required /></div>
                      </div>
                      {formData.diyType === 'Other' && (
                        <div className="form-grid" style={{ marginTop: '1rem' }}>
                          <div className="form-group" style={{ margin: 0 }}><label className="form-label">Measurement / Volume <span style={{color:'var(--error)'}}>*</span></label><input className="input-field" type="text" placeholder="e.g. 20, 1" value={formData.skuDetails[`${formData.diyType}-${size}`]?.dimension || ''} onChange={(e) => handleSkuChange(`${formData.diyType}-${size}`, 'dimension', e.target.value)} required /></div>
                          <div className="form-group" style={{ margin: 0 }}><label className="form-label">Unit <span style={{color:'var(--error)'}}>*</span></label>
                            <select className="input-field select-field" value={formData.skuDetails[`${formData.diyType}-${size}`]?.unit || ''} onChange={(e) => handleSkuChange(`${formData.diyType}-${size}`, 'unit', e.target.value)} required>
                              <option value="">Select Unit</option>
                              <option value="ml">ml</option>
                              <option value="L">L</option>
                              <option value="g">g</option>
                              <option value="kg">kg</option>
                              <option value="meter">meter</option>
                              <option value="cm">cm</option>
                              <option value="piece">piece</option>
                              <option value="pack">pack</option>
                              <option value="roll">roll</option>
                              <option value="bottle">bottle</option>
                            </select>
                          </div>
                        </div>
                      )}
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
        <button className="btn-primary" onClick={nextStep} disabled={!isStepValid()}>Next: Media & Logistics</button>
      </div>
    </div>
  );

  const renderLogistics = () => (
    <div className="form-section">
      <header className="step-header"><h2 className="step-title">Logistics</h2><p className="step-desc">Finalize the submission with transit and procurement timelines.</p></header>
      
      <div className="form-group">
        <label className="form-label">Product Availability <span style={{color:'var(--error)'}}>*</span></label>
        <select name="stockStatus" className="input-field select-field" value={formData.stockStatus} onChange={handleInputChange} required>
          <option value="in_stock">In Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      <div className="form-grid">
        {formData.stockStatus === 'in_stock' && (
          <div className="form-group">
            <label className="form-label">
              Transit (In Stock) <Tooltip title="Transit Timeline" desc="Days to deliver since product is currently in your stock." />
            </label>
            <input type="number" name="transitDays" className="input-field" placeholder="Days" value={formData.transitDays} onChange={handleInputChange} />
          </div>
        )}
        {formData.stockStatus === 'out_of_stock' && (
          <div className="form-group">
            <label className="form-label">
              Procurement (Out of Stock) <Tooltip title="Backorder Timeline" desc="Days to procure from manufacturer and deliver if out of stock." />
            </label>
            <input type="number" name="oosDays" className="input-field" placeholder="Days" value={formData.oosDays} onChange={handleInputChange} />
          </div>
        )}
      </div>
      
      <div className="button-group" style={{ flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', width: '100%', gap: '1rem' }}>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={prevStep}>Back</button>
          <button className="btn-secondary" style={{ flex: 1, borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }} onClick={handleAddAnotherProduct}>Add Another Product</button>
        </div>
        <button className="btn-primary" style={{ background: 'var(--success)', width: '100%' }} onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Complete Submission'}
        </button>
      </div>
    </div>
  );

  if (isSubmitted) {
    return (
      <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <header className="portal-header">
          <h1 className="portal-logo">PlushMyRide</h1>
          <p className="portal-subtitle">Supplier Management Portal</p>
        </header>
        <main className="form-container">
          <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', border: '2px solid var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: '40px', height: '40px' }}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className="step-title" style={{ marginBottom: '1rem', color: 'var(--success)' }}>Successfully Submitted!</h2>
            <p className="step-desc" style={{ maxWidth: '400px', margin: '0 auto', fontSize: '1.1rem' }}>
              Thank you for submitting your product details. Our team will review the information and get back to you shortly.
            </p>
          </div>
        </main>
      </div>
    );
  }

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
      
      <div style={{ display: 'flex', gap: '2rem', width: '100%', maxWidth: products.length > 0 ? '1200px' : '640px', transition: 'max-width 0.3s ease' }}>
        {products.length > 0 && (
          <aside style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'stepFadeIn 0.4s ease-out' }}>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, paddingLeft: '0.5rem' }}>Queued Products ({products.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '0.5rem' }} className="sku-logic-scroll">
              {products.map((p, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span style={{ background: 'var(--accent-cyan)', color: '#000', fontSize: '0.7rem', fontWeight: 800, padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{p.productType}</span>
                    <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0 }} onClick={() => handleEditProduct(idx)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Edit
                    </button>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#fff', marginBottom: '0.25rem' }}>{p.brandName}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{p.productType === 'DIY' ? p.diyType : (p.productType === 'Coating' ? p.coatingType : p.productName)}</div>
                </div>
              ))}
            </div>
          </aside>
        )}
        
        <main className="form-container" style={{ flex: 1, margin: 0, maxWidth: '100%' }}>
          <div className="glass-card">
            {step === 1 && renderVerification()}
            {step === 2 && renderSupplierInfo()}
            {step === 3 && renderProductIdentification()}
            {step === 4 && renderSKUDetails()}
            {step === 5 && renderLogistics()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProductForm;
