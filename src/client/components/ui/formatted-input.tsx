import { toCents, toDollars } from "@/shared/utils/currency";
import { useController, type Control } from "react-hook-form";

type Formatter<T> = {
    format: (value: T) => string,
    parse: (value: string) => T,
}
function FormattedInput<T>({ name, control, formatter }: { name: string, control: Control, formatter: Formatter<T> }) {
    const { field } = useController({ name, control })
    return <input
        {...field}
        value={formatter.format(field.value)}
        onChange={e => field.onChange(formatter.parse(e.target.value))}
    />
}
export function MoneyInput({ name, control }: { name: string, control: Control }) {
    return <FormattedInput name={name} control={control}
        formatter={{
            format: (value: number) => toDollars(value).toString(),
            parse: value => toCents(parseFloat(value))
        }}
    />
}
