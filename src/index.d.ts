export interface ProviderOptions {
  autoValidateDelay?: number;
  styles?: Partial<StyleCollection>;
  classes?: Partial<ClassCollection>;
  components?: Partial<ComponentCollection>;
  events?: Partial<EventCollection>;
  native?: boolean;
  noMarkup?: boolean;
  renderForm?: RenderFormCallback;
  renderField?: RenderFieldCallback;
  messages?: Partial<ValidateMessages>;
  valueProp?: "value";
  suppressWarning?: boolean;
}

export interface FormItem {
  name: string[];
  dirty: boolean;
  val: Validation;
}

export interface Validation {
  status: "unknown" | "invalid" | "valid";
  errors: Error[];
}

export interface Form extends FormItem {
  id: string;
  parent: Form;
  fields: { [key: string]: Field };
  reset(): void;
  handleSubmit(e?: Event): void;
  handleSubmit(
    onSuccess: Callback2<any, Form>,
    onError?: Callback2<any, Form>
  ): void;
  handleReset(e: Event): void;
  handleReset(onReset: Callback1<Form>): void;
}

export interface Field {
  form: Form;
  comp: any;
  name: string[];
  dirty: boolean;
  val: Validation;
  label: any;
  help: any;
  valueProp: string;
  changeEvent: string;
  defaultValue: any;
}

export type RenderFieldCallback = (
  field?: Field,
  children?: any,
  options?: ProviderOptions
) => any;

export type RenderFormCallback = (
  form?: Form,
  children?: any,
  options?: any
) => any;

export interface StyleCollection {
  [key: string]: { [style: string]: any };
}

export interface ComponentCollection {
  form: any;
  input: any;
  field: any;
  labelWrapper: any;
  contentWrapper: any;
  label: any;
  help: any;
  errorList: any;
  error: any;
}

export interface EventCollection {
  submit: string;
  reset: string;
  change: string;
}

export interface ClassCollection {
  field: string;
  invalid: string;
  valid: string;
  dirty: string;
  label: string;
  labelWrapper: string;
  contentWrapper: string;
  error: string;
  errorList: string;
  required: string;
  busy: string;
  input: string;
}

export type Callback1<T> = (arg1: T) => void;
export type Callback2<T, U> = (arg1: T, arg2: U) => void;

export interface FormElementProps {
  name?: string | string[];
  value?: any;
  initialValue?: any;
  onSubmit?: Callback1<Form>;
  onSuccess?: Callback2<any, Form>;
  onError?: Callback2<Error[], Form>;
  onChange?: Callback2<any, Form>;
  onReset?: Callback1<Form>;
  children?: any;
}

export type FormElement = (props?: FormElementProps) => any;

export interface FieldElementProps {
  name?: string | string[];
  children?: any;
  label?: Helper<Field>;
  help?: Helper<Field>;
  comp?: string | Function;
  rules?: Rule;
  autoValidate?: boolean;
  valueProp?: string;
  changeEvent?: string;
  defaultValue?: any;
  classes?: string | string[];
  styles?: string | string[];
  onChange?: Callback2<any, Field>;
}
export type Rule = RuleItem | RuleItem[];

export type RuleType =
  | "string"
  | "number"
  | "boolean"
  | "method"
  | "regexp"
  | "integer"
  | "float"
  | "array"
  | "object"
  | "enum"
  | "date"
  | "url"
  | "hex"
  | "email"
  | "pattern"
  | "any";

export interface RuleItem {
  type?: RuleType; // default type is 'string'
  required?: boolean;
  pattern?: RegExp | string;
  min?: number; // Range of type 'string' and 'array'
  max?: number; // Range of type 'string' and 'array'
  len?: number; // Length of type 'string' and 'array'
  enum?: Array<string | number | boolean | null | undefined>; // possible values of type 'enum'
  whitespace?: boolean;
  fields?: Record<string, RuleItem>; // ignore when without required
  defaultField?: RuleItem; // 'object' or 'array' containing validation rules
  transform?: (value: any) => any;
  message?: string;
  validator?: CustomValidator;
  params?: string[] | { [key: string]: string | string[] };
}

export interface ValidatorContext extends RuleItem {
  callback: Function;
  params: { [key: string]: any };
}

export type CustomValidator = (
  value: any,
  context?: ValidatorContext
) => boolean | Promise<any> | Error | Error[];

export type Helper<T, V = any> = (target: T) => V;

export type FieldElement = (props?: FieldElementProps) => any;

export interface FormProvider {
  Form: FormElement;
  Field: FieldElement;
}

export type ValidateMessage = string | (() => string);

export interface ValidateMessages {
  default?: ValidateMessage;
  required?: ValidateMessage;
  enum?: ValidateMessage;
  whitespace?: ValidateMessage;
  date?: {
    format?: ValidateMessage;
    parse?: ValidateMessage;
    invalid?: ValidateMessage;
  };
  types?: {
    string?: ValidateMessage;
    method?: ValidateMessage;
    array?: ValidateMessage;
    object?: ValidateMessage;
    number?: ValidateMessage;
    date?: ValidateMessage;
    boolean?: ValidateMessage;
    integer?: ValidateMessage;
    float?: ValidateMessage;
    regexp?: ValidateMessage;
    email?: ValidateMessage;
    url?: ValidateMessage;
    hex?: ValidateMessage;
  };
  string?: {
    len?: ValidateMessage;
    min?: ValidateMessage;
    max?: ValidateMessage;
    range?: ValidateMessage;
  };
  number?: {
    len?: ValidateMessage;
    min?: ValidateMessage;
    max?: ValidateMessage;
    range?: ValidateMessage;
  };
  array?: {
    len?: ValidateMessage;
    min?: ValidateMessage;
    max?: ValidateMessage;
    range?: ValidateMessage;
  };
  pattern?: {
    mismatch?: ValidateMessage;
  };
}

declare function createProvider(options?: ProviderOptions): FormProvider;

export default createProvider;
