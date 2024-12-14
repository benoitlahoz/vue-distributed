import type { Component } from 'vue';
import { h } from 'vue';
import {
  VuePluginComponentMandatory,
  VuePluginComponent,
  VuePluginComponentProp,
} from '@/core/types';
import { intersects, VueDistributedLogger } from '@/core/utils';
import { formatDescription } from './description-formatter';

export const formatComponent = (input: any, logger: VueDistributedLogger) => {
  if (isVueDistributed(input)) {
    return {
      ...input,
      description: {
        ...formatDescription(input.description, logger),
        props: parseProps(input),
        emits: parseEmits(input),
      },
    };
  }

  if (isVueComponent(input)) {
    return {
      name: input.name || input.__name,
      export: input,
      props: parseProps(input),
      emits: parseEmits(input),
    };
  }
};

export const isVueDistributed = (input: any) => {
  try {
    const mandatoryKeys = Object.keys(VuePluginComponentMandatory);
    const inputKeys = Object.keys(input);

    if (intersects(mandatoryKeys, inputKeys) < mandatoryKeys) {
      return false;
    }

    if (!isVueComponent(input.export)) {
      return false;
    }

    return true;
  } catch (_err: unknown) {
    return false;
  }
};

export const isVueComponent = (input: any) => {
  try {
    const vnode = h(input);

    if (!vnode.type) {
      return false;
    }

    // Check if it's just an HTML Element
    if (typeof vnode.type === 'string') {
      return false;
    }

    // A component that has render or setup property
    const type: any = (vnode as any).type;
    if (type.setup || type.render) {
      return true;
    }

    // Check if functional component
    // https://vuejs.org/guide/extras/render-function.html#functional-components
    if (type.emits || type.props) {
      return true;
    }
  } catch (_err: unknown) {
    return false;
  }

  return false;
};

export const parseProps = (input: Component | VuePluginComponent) => {
  const propsDefinitions: Record<string, any> = {};

  const component = (input as any).import ?? input;
  const props: any = component.props;

  for (const key in props) {
    const definition: VuePluginComponentProp = {};

    const prop = props[key];
    if (prop === null) {
      definition.default = null;
      propsDefinitions[key] = definition;
      continue;
    }

    definition.required = prop.required || false;

    if (typeof prop.default === 'function') {
      // WARNING: running the default function here.

      const result = prop.default();

      // Avoid passing functions in the returned definition.

      definition.default = JSON.parse(JSON.stringify(result, null, 2));
    }

    if (typeof prop.type === 'function') {
      definition.type = prop.type.name.toLowerCase();
    }

    if (typeof prop.validator !== 'undefined') {
      definition.validator = true;
    }

    propsDefinitions[key] = definition;
  }

  return propsDefinitions;
};

export const parseEmits = (input: Component | VuePluginComponent) => {
  const component = (input as any).import ?? input;
  return component.emits || [];
};
