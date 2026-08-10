import { CheckCircle2, CreditCard, Lock, QrCode, ShieldCheck, X } from 'lucide-react'
import { useState } from 'react'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''

export default function PaymentGatewayModal({ invoice, onClose, onSuccess }) {
  const token = localStorage.getItem('smartwater.accessToken')
  const [method, setMethod] = useState('UPI')
  const [upiId, setUpiId] = useState('resident@upi')
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8892')
  const [cardExpiry, setCardExpiry] = useState('12/28')
  const [cardCvv, setCardCvv] = useState('882')
  const [selectedBank, setSelectedBank] = useState('State Bank of India')
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [txnId, setTxnId] = useState('')

  if (!invoice) return null

  const amountFormatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(invoice.totalAmount)

  async function handleConfirmPayment(e) {
    e.preventDefault()
    setProcessing(true)
    setErrorMsg('')

    // Generate reference code
    const generatedRef = `TXN-${Math.floor(100000 + Math.random() * 900000)}`
    setTxnId(generatedRef)

    // Simulate 1.5s secure gateway delay
    await new Promise((res) => setTimeout(res, 1400))

    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
      const r = await fetch(`${apiBaseUrl}/api/invoices/${invoice.id}/pay`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          paymentMethod: method,
          transactionRef: generatedRef,
        }),
      })

      if (r.ok) {
        setSuccess(true)
        if (onSuccess) onSuccess()
      } else {
        setErrorMsg('Payment transaction failed. Please try again.')
      }
    } catch {
      setErrorMsg('Could not reach payment gateway server.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-sky-600 text-white shadow-md">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900">Secure Payment Gateway</h3>
            <p className="text-xs text-slate-500">256-bit SSL Encrypted Water Bill Payment</p>
          </div>
        </div>

        {/* Success View */}
        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-6 text-center space-y-4 animate-fadeIn">
            <CheckCircle2 size={48} className="mx-auto text-emerald-600" />
            <div>
              <h4 className="font-display text-xl font-bold text-emerald-950">Payment Successful!</h4>
              <p className="text-xs text-emerald-800 mt-1">
                Your water bill invoice <strong className="font-mono text-slate-900">{invoice.invoiceCode}</strong> has been marked as <strong>PAID</strong>.
              </p>
            </div>

            <div className="rounded-lg bg-white p-4 border border-emerald-200 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-900">{txnId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-bold text-emerald-700">{amountFormatted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-semibold text-slate-800">{method}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              Done & Return to Invoices
            </button>
          </div>
        ) : (
          <form onSubmit={handleConfirmPayment} className="space-y-4">
            {/* Invoice Summary Box */}
            <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-sky-900 block">Flat {invoice.flatNumber} Water Bill</span>
                <span className="text-[11px] text-slate-600">Metered Consumption: {invoice.consumptionKl} kL</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Total Due</span>
                <span className="font-display text-xl font-black text-sky-900">{amountFormatted}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Select Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('UPI')}
                  className={`rounded-xl border p-3 text-xs font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    method === 'UPI'
                      ? 'border-sky-600 bg-sky-50 text-sky-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <QrCode size={18} className="text-sky-600" />
                  UPI / GPay
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('CARD')}
                  className={`rounded-xl border p-3 text-xs font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    method === 'CARD'
                      ? 'border-sky-600 bg-sky-50 text-sky-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <CreditCard size={18} className="text-teal-600" />
                  Debit/Credit
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('NETBANKING')}
                  className={`rounded-xl border p-3 text-xs font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    method === 'NETBANKING'
                      ? 'border-sky-600 bg-sky-50 text-sky-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Lock size={18} className="text-amber-600" />
                  Net Banking
                </button>
              </div>
            </div>

            {/* Method Details Input */}
            {method === 'UPI' && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-lg bg-white border border-slate-200 p-1.5 grid place-items-center shrink-0">
                    <QrCode size={36} className="text-slate-800" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Instant Scan & Pay</span>
                    <span className="text-[11px] text-slate-500">Supports Google Pay, PhonePe, Paytm & BHIM</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Enter UPI ID</label>
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. yourname@upi"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-sky-600 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {method === 'CARD' && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Card Number</label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-sky-600 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date</label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-sky-600 focus:outline-none text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">CVV</label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-sky-600 focus:outline-none text-center"
                    />
                  </div>
                </div>
              </div>
            )}

            {method === 'NETBANKING' && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                <label className="block text-xs font-bold text-slate-700">Choose Bank</label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-sky-600 focus:outline-none"
                >
                  <option>State Bank of India</option>
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>Axis Bank</option>
                  <option>Punjab National Bank</option>
                </select>
              </div>
            )}

            {errorMsg && (
              <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">{errorMsg}</p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 rounded-xl border border-slate-300 bg-white py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                className="w-2/3 rounded-xl bg-sky-600 py-3 text-sm font-bold text-white shadow-md hover:bg-sky-700 transition-colors disabled:opacity-70 cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock size={15} />
                {processing ? 'Processing Payment...' : `Confirm & Pay ${amountFormatted}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
