import type {
  Nullable,
  VuePluginAuthor,
  VuePluginDescription,
} from '@/core/types';
import { VueDistributedLogger } from '@/core/utils';

export const formatDescription = (
  description: Nullable<string | VuePluginDescription>,
  logger: VueDistributedLogger
) => {
  const res: VuePluginDescription = {};

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
            ? formatAuthors(description.authors)
            : null;
          res.contributors = description.contributors
            ? formatAuthors(description.contributors)
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
    logger.warn(
      `An error occurred while parsing plugin description. Bypassing.`
    );
    logger.warn(err);

    res.info = null;
    res.authors = null;
    res.contributors = null;
  }

  return res;
};

const formatAuthors = (
  authors?: Nullable<string | VuePluginAuthor | VuePluginAuthor[]>
): VuePluginAuthor[] => {
  const parseAuthor = (
    name?: Nullable<string>,
    email?: Nullable<string>,
    url?: Nullable<string>
  ) => {
    return {
      name: name || null,
      email: email || null,
      url: url || null,
    };
  };

  if (typeof authors === 'string') {
    return [parseAuthor(authors)];
  } else if (
    authors !== null &&
    typeof authors === 'object' &&
    !Array.isArray(authors)
  ) {
    return [parseAuthor(authors.name, authors.email, authors.url)];
  } else if (
    authors !== null &&
    typeof authors === 'object' &&
    Array.isArray(authors)
  ) {
    const res: VuePluginAuthor[] = [];
    for (const author of authors) {
      const auth: VuePluginAuthor = author as VuePluginAuthor;
      res.push(parseAuthor(auth.name, auth.email, auth.url));
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
};
