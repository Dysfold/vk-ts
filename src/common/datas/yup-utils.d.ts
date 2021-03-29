import * as yup from 'yup';
import { ObjectSchema } from 'yup';
import { RequiredBooleanSchema } from 'yup/lib/boolean';
import { RequiredNumberSchema } from 'yup/lib/number';
import { ObjectShape } from 'yup/lib/object';
import { RequiredStringSchema } from 'yup/lib/string';
import { TypedSchema } from 'yup/lib/util/types';

export type InferShape<TSchema> = TSchema extends ObjectSchema<infer TShape>
  ? TShape
  : never;

/**
 * Extracts keys that can be undefined from object. Note that yup.default()
 * causes keys not to appear here (use OptionalKeys if you need that).
 */
export type NullableKeys<TShape extends ObjectShape> = string &
  {
    [K in keyof TShape]?: TShape[K] extends TypedSchema
      ? undefined extends yup.InferType<TShape[K]>
        ? K
        : never
      : never;
  }[keyof TShape];

/**
 * Infers a TS type from object shape. Use InferType to infer the shape too.
 */
export type Data<TShape extends ObjectShape> = {
  // Keys that are nullable even after validation
  [K in NullableKeys<TShape>]?: TShape[K] extends TypedSchema
    ? yup.InferType<TShape[K]>
    : any;
} &
  // Required keys and keys with default values
  {
    [K in Exclude<
      keyof TShape,
      NullableKeys<TShape>
    >]: TShape[K] extends TypedSchema ? yup.InferType<TShape[K]> : any;
  };

/**
 * Extracts keys that can be undefined or have default values.
 */
export type OptionalKeys<TShape extends ObjectShape> = string &
  // Nullable keys and string/number/boolean keys with default values
  {
    [K in keyof TShape]?: TShape[K] extends TypedSchema
      ? undefined extends yup.InferType<TShape[K]>
        ? K // Optional key that can be undefined
        : TShape[K] extends RequiredStringSchema<string, Record<string, any>>
        ? never // Required string
        : TShape[K] extends RequiredNumberSchema<number, Record<number, any>>
        ? never // Required number
        : TShape[K] extends RequiredBooleanSchema<boolean, Record<boolean, any>>
        ? never // Required boolean
        : K // Not required string/number/boolean
      : never;
  }[keyof TShape];

/**
 * Infers a TS type with all non-essential data marked as optional.
 */
export type PartialData<TShape extends ObjectShape> = {
  // Keys that are optional in object creation
  [K in OptionalKeys<TShape>]?: TShape[K] extends TypedSchema
    ? yup.InferType<TShape[K]>
    : any;
} &
  // Keys that are required at object creation
  {
    [K in Exclude<
      keyof TShape,
      OptionalKeys<TShape>
    >]: TShape[K] extends TypedSchema ? yup.InferType<TShape[K]> : any;
  };

export type InferType<TSchema> = Data<InferShape<TSchema>>;
