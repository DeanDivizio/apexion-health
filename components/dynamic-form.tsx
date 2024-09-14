'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

export function DynamicForm() {
  const { toast } = useToast()
  const [formType, setFormType] = useState('text')
  const [formData, setFormData] = useState({
    text: '',
    email: '',
    number: '',
    textarea: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: "Form Submitted",
      description: `Form Type: ${formType}, Value: ${formData[formType as keyof typeof formData]}`,
    })
  }

  const renderInput = () => {
    switch (formType) {
      case 'text':
        return (
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="text">Text Input</Label>
            <Input type="text" id="text" name="text" value={formData.text} onChange={handleInputChange} />
          </div>
        )
      case 'email':
        return (
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="email">Email Input</Label>
            <Input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} />
          </div>
        )
      case 'number':
        return (
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="number">Number Input</Label>
            <Input type="number" id="number" name="number" value={formData.number} onChange={handleInputChange} />
          </div>
        )
      case 'textarea':
        return (
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="textarea">Textarea Input</Label>
            <Textarea id="textarea" name="textarea" value={formData.textarea} onChange={handleInputChange} />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Select onValueChange={(value) => setFormType(value)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select input type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="text">Text</SelectItem>
          <SelectItem value="email">Email</SelectItem>
          <SelectItem value="number">Number</SelectItem>
          <SelectItem value="textarea">Textarea</SelectItem>
        </SelectContent>
      </Select>
      {renderInput()}
      <Button type="submit">Submit</Button>
    </form>
  )
}