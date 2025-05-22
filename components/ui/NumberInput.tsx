import { ChangeEventHandler } from "react";
import { Input } from "../ui_primitives/input";

export default function NumberInput({onChange, placeholder, className}:{onChange: ChangeEventHandler<HTMLInputElement>, placeholder: string, className?: string}) {
  return (
      <Input type="tel" inputMode="decimal" pattern="[0-9]*" onChange={onChange} placeholder={placeholder} className={className}/>
  );
}
