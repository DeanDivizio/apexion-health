import { ChangeEventHandler } from "react";
import { Input } from "../ui_primitives/input";

export default function NumberInput({onChange}:{onChange: ChangeEventHandler<HTMLInputElement>}) {
  return (
      <Input type="tel" inputMode="decimal" pattern="[0-9]*" onChange={onChange}/>
  );
}
