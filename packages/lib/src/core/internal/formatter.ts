import type { Component } from 'vue';
import { h } from 'vue';
import type {
  Nullable,
  GenericDescription,
  AuthorDescription,
  ComponentDefinition,
  ComponentProp,
} from '@/core/types';
import { ComponentDefinitionMandatoryKeys } from '@/core/types';
import { intersects } from '@/core/utils';
import { Context } from '@/core/internal/context';

class _Formatter {
  /**
   * Clean a path (e.g. an URL).
   *
   * @param { string } path The path to clean.
   * @returns { string } A clean path.
   */
  public cleanPath(path: string) {
    return path.trim();
  }

  /**
   * Get a library name from an URL.
   *
   * @param { string } url An URL.
   * @returns { string } The name of the library.
   */
  public libraryNameFromUrl(url: string, suffix = 'umd'): string | undefined {
    const reg = new RegExp(`^(.*?)\.${suffix}`);
    const match = url
      .split('/')
      .reverse()[0]
      // Old regexp.
      // .match(/^(.*?)\.umd/)[1];
      .match(reg);

    if (match) {
      return match[1];
    }
    return;
  }

  /**
   * Format a vue component or a component definition.
   *
   * @param { Component | ComponentDefinition } input The input to conform to `ComponentDefinition`.
   * @returns { ComponentDefinition | undefined } A `ComponentDefinition` or `undefined` if input
   * couldn't be parsed.
   */
  public formatComponent(
    input: Component | ComponentDefinition
  ): ComponentDefinition | undefined {
    if (this.isComponentDefinition(input)) {
      return {
        ...(input as ComponentDefinition),
        description: {
          ...this.formatDescription(
            (input as ComponentDefinition).description || null
          ),
        },
        props: this.parseProps(input),
        emits: this.parseEmits(input),
      };
    }

    if (this.isVueComponent(input)) {
      if (
        typeof input.name === 'undefined' &&
        typeof (input as any).__name === 'undefined'
      ) {
        throw new Error(`Could not import component without name.`);
      }

      return {
        name: input.name || (input as any).__name,
        export: input,
        props: this.parseProps(input),
        emits: this.parseEmits(input),
      };
    }

    return;
  }

  /**
   * Checks if any input is a valid `VueDistributed`'s component definition.
   *
   * @param { any } input Any input to check.
   * @returns { boolean } `true` if valid.
   */
  public isComponentDefinition(input: any) {
    try {
      const mandatoryKeys = Object.keys(ComponentDefinitionMandatoryKeys);
      const inputKeys = Object.keys(input);

      if (intersects(mandatoryKeys, inputKeys).length < mandatoryKeys.length) {
        return false;
      }

      if (!this.isVueComponent(input.export)) {
        return false;
      }

      return true;
    } catch (_err: unknown) {
      return false;
    }
  }

  /**
   * Checks if any input is a valid `Vue`'s component.
   *
   * @param { any } input Any input to check.
   * @returns { boolean } `true` if valid.
   */
  public isVueComponent(input: any) {
    try {
      // Try to render the eventual component.
      const vnode = h(input);

      if (!vnode.type) {
        return false;
      }

      // Check if it's just an HTML Element.
      if (typeof vnode.type === 'string') {
        return false;
      }

      // A component that has render or setup property.
      const type: any = (vnode as any).type;
      if (type.setup || type.render) {
        return true;
      }

      // Check if component is 'functional'.
      // https://vuejs.org/guide/extras/render-function.html#functional-components
      if (type.emits || type.props) {
        return true;
      }
    } catch (_err: unknown) {
      return false;
    }

    return false;
  }

  /**
   * Parse component's properties and try to get their configuration.
   *
   * @param { Component | ComponentDefinition } input The vue component or our component definition.
   * @returns { Record<string, ComponentProp> } A properties object for given component.
   */
  private parseProps(
    input: Component | ComponentDefinition
  ): Record<string, ComponentProp> {
    const propsDefinitions: Record<string, ComponentProp> = {};

    const component = (input as any).import ?? input;
    const props: any = component.props;

    for (const key in props) {
      const definition: ComponentProp = {};

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
  }

  /**
   * Parse emits of a component.
   *
   * @param { Component | ComponentDefinition } input The vue component or our component definition.
   * @returns { string[] } An array of component's emits.
   */
  private parseEmits(input: Component | ComponentDefinition) {
    const component = (input as any).import ?? input;
    return component.emits || [];
  }

  /**
   * Format a generic (module, component, etc.) exported description.
   *
   * @param { string | GenericDescription | null } description The description to format.
   * @returns { GenericDescription } The description formatted.
   *
   * @todo Not at its place.
   */
  public formatDescription(description: Nullable<string | GenericDescription>) {
    const res: GenericDescription = {};

    try {
      switch (typeof description) {
        case 'string': {
          res.info = description;
          res.authors = null;
          res.contributors = null;
          break;
        }
        case 'object': {
          if (description !== null) {
            res.info = description.info || null;
            res.authors = description.authors
              ? this.formatAuthors(description.authors)
              : null;
            res.contributors = description.contributors
              ? this.formatAuthors(description.contributors)
              : null;
          }
          break;
        }
        default: {
          // null or undefined.
          res.info = null;
          res.authors = null;
          res.contributors = null;
          break;
        }
      }
    } catch (err: unknown) {
      Context.warn(`An error occurred while parsing plugin description.`);
      Context.error(err);

      res.info = null;
      res.authors = null;
      res.contributors = null;
    }

    return res;
  }

  /**
   * Format the module 'authors' input.
   *
   * @param {string | AuthorDescription | AuthorDescription[] | null } authors The authors input.
   * @returns { AuthorDescription[] } An array of authors descriptions.
   */
  private formatAuthors(
    authors?: Nullable<string | AuthorDescription | AuthorDescription[]>
  ): AuthorDescription[] {
    if (typeof authors === 'string') {
      // With string as name.
      return [this.conformAuthor(authors)];
    } else if (
      authors !== null &&
      typeof authors === 'object' &&
      !Array.isArray(authors)
    ) {
      // With only one author formatted.
      return [this.conformAuthor(authors.name, authors.email, authors.url)];
    } else if (
      authors !== null &&
      typeof authors === 'object' &&
      Array.isArray(authors)
    ) {
      // Multiple authors.
      const res: AuthorDescription[] = [];
      for (const author of authors) {
        const auth: AuthorDescription = author as AuthorDescription;
        res.push(this.conformAuthor(auth.name, auth.email, auth.url));
      }
      return res;
    }

    return [
      {
        name: null,
        email: null,
        url: null,
      },
    ];
  }

  /**
   * Conforms any type of 'author' input in a strict description object.
   *
   * @param { string | null } name
   * @param { string | null } email
   * @param { string | null } url
   * @returns { AuthorDescription } The description of the author.
   */
  private conformAuthor(
    name?: Nullable<string>,
    email?: Nullable<string>,
    url?: Nullable<string>
  ): AuthorDescription {
    return {
      name: name || null,
      email: email || null,
      url: url || null,
    };
  }
}

const formatter = new _Formatter();
Object.seal(formatter);
export { formatter as Formatter };
