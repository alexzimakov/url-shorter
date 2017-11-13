/** @module linkController */

const Link = require('../models/link');
const { ApiError, ValidationError, ResponseError } = require('../lib/error-classes');


/**
 * Controller for handling POST /api/v1/links route.
 *
 * @param {User} authUser
 * @param {Object} data
 * @returns {Promise.<Object>}
 */
async function create({ authUser, data }) {
  const link = await Link.create({ ...data, author: authUser._id });

  if (!link.isValid) {
    throw new ValidationError(link.errors);
  }

  return { link: link.toObject() };
}


/**
 * Controller for handling GET /api/v1/links/:id route.
 *
 * @param {GuestUser|User} authUser
 * @param {ObjectID|String} id
 * @returns {Promise.<Object>}
 */
async function getOne({ authUser, id }) {
  const link = await Link.findById(id);
  let linkObject;

  if (!link) {
    throw new ApiError('Ссылка не найдена.', 404);
  }

  if (authUser.isAdmin || (authUser.isUser && link.isAuthor(authUser))) {
    linkObject = link.toObject();
  } else {
    linkObject = link.exclude('clicks');
  }

  return { link: linkObject };
}


/**
 * Controller for handling GET /api/v1/links route.
 *
 * @param {GuestUser|User} authUser
 * @param {Object} query
 * @returns {Promise.<Object>}
 */
async function getMany({ authUser, query = {} }) {
  const count = await Link.count(query.filter);
  let links = await Link.findAll(query);

  links = links.map((link) => {
    let linkObject;
    if (authUser.isGuest) {
      linkObject = link.exclude('clicks');
    }

    if (authUser.isUser) {
      if (link.isAuthor(authUser)) {
        linkObject = link.toObject();
      } else {
        linkObject = link.exclude('clicks');
      }
    }

    if (authUser.isAdmin) {
      linkObject = link.toObject();
    }

    return linkObject;
  });

  return { count, links };
}


/**
 * Controller for handling PUT /api/v1/links/:id route.
 *
 * @param {User} authUser
 * @param {ObjectID|String} id
 * @param {Object} update
 * @returns {Promise.<Object>}
 */
async function updateOne({ authUser, id, update }) {
  const link = await Link.findById(id);

  if (!link) {
    throw new ApiError('Ссылка не найдена.', 404);
  }

  if (!authUser.isAdmin && !link.isAuthor(authUser)) {
    throw new ApiError('Недостаточно прав.', 403);
  }

  await link.update(update);

  if (!link.isValid) {
    throw new ValidationError(link.errors);
  }

  return { link: link.toObject() };
}


/**
 * Controller for handling PUT /api/v1/links route.
 *
 * @param {User} authUser
 * @param {Object} filter
 * @param {Object} update
 * @returns {Promise.<void>}
 */
async function updateMany({ authUser, filter, update }) {
  if (authUser.isAdmin) {
    await Link.updateAll({ filter, update });
  }

  if (authUser.isUser) {
    await Link.updateAll({
      filter: { ...filter, author: authUser._id },
      update,
    });
  }
}


/**
 * Controller for handling DELETE /api/v1/links/:id route.
 *
 * @param {GuestUser, User} authUser
 * @param {ObjectID|String} id
 * @returns {Promise.<void>}
 */
async function deleteOne({ authUser, id }) {
  const link = await Link.findById(id);

  if (!link) {
    throw new ApiError('Ссылка не найдена.', 404);
  }

  if (!authUser.isAdmin || (authUser.isUser && !link.isAuthor(authUser))) {
    throw new ApiError('Недостаточно прав.', 403);
  }

  await link.destroy();
}


/**
 * Controller for handling DELETE /api/v1/links/:id route.
 *
 * @param {User} authUser
 * @param {Object} filter
 * @returns {Promise.<void>}
 */
async function deleteMany({ authUser, filter }) {
  if (authUser.isAdmin) {
    await Link.destroyAll(filter);
  }

  if (authUser.isUser) {
    await Link.destroyAll({ ...filter, author: authUser._id });
  }
}


/**
 * Controller for handling GET /:hash route.
 *
 * @param {String} hash
 * @returns {Promise.<Object>}
 */
async function updateLinkStatistics(hash) {
  const link = await Link.find({ hash });

  if (!link) {
    throw new ResponseError('Ссылка не найдена.', 404);
  }

  await link.updateStatistics();

  return link.originalUrl;
}


module.exports = {
  create,
  getOne,
  getMany,
  updateOne,
  updateMany,
  deleteOne,
  deleteMany,
  updateLinkStatistics,
};
