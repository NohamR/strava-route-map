import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface AuthProps {
  token: string | null
  loading: boolean
  error: string
  onSendOtp: (email: string) => Promise<string | null>
  onVerifyOtp: (email: string, state: string, otp: string) => Promise<boolean>
  onLogout: () => void
  onSetError: (msg: string) => void
}

export function Auth({ token, loading, error, onSendOtp, onVerifyOtp, onLogout, onSetError }: AuthProps) {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpState, setOtpState] = useState<string | null>(null)
  const [step, setStep] = useState<'email' | 'otp'>('email')

  if (token) {
    return (
      <div className="flex items-center py-0.5">
        <span className="text-xs font-semibold text-green-600">✓ Authenticated</span>
        <button
          className="ml-2 text-[#a89f97] underline text-[10px] cursor-pointer"
          onClick={onLogout}
        >
          log out
        </button>
      </div>
    )
  }

  const handleSendOtp = async () => {
    if (!email.trim()) { onSetError('Enter your email'); return }
    onSetError('')
    const state = await onSendOtp(email.trim())
    if (state) {
      setOtpState(state)
      setStep('otp')
    }
  }

  const handleVerify = async () => {
    if (!otp.trim()) { onSetError('Enter the OTP code'); return }
    onSetError('')
    const ok = await onVerifyOtp(email.trim(), otpState!, otp.trim())
    if (ok) {
      setOtp('')
      setOtpState(null)
      setStep('email')
    }
  }

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <Input
        type="email"
        placeholder="Strava email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 min-w-[160px] sm:min-w-[180px] h-8 text-sm font-mono"
        disabled={step === 'otp'}
      />
      {step === 'otp' && (
        <Input
          type="text"
          placeholder="OTP code"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="flex-1 min-w-[90px] h-8 text-sm font-mono"
        />
      )}
      <Button
        size="sm"
        className={`text-xs h-8 ${step === 'email' ? 'bg-strava text-white hover:bg-[#e04402]' : 'bg-[#ddd8d0] text-[#3e3a35] hover:bg-[#cec8be]'}`}
        onClick={step === 'email' ? handleSendOtp : handleVerify}
        disabled={loading}
      >
        {loading ? (step === 'email' ? 'Sending...' : 'Verifying...') : step === 'email' ? 'Send OTP' : 'Verify'}
      </Button>
      {error && <div className="w-full text-red-600 text-xs">{error}</div>}
    </div>
  )
}
