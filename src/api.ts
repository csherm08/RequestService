import { transaction } from 'objection';
import * as express from 'express';
import Order from "./models/Order";
import Person from './models/Person';
import Product from './models/Product';
import Animal from './models/Animal';
import Movie from './models/Movie';

export default (router: express.Router) => {

  // Create a new Product
  router.post('/products', async (req, res) => {
    const body = req.body;
    console.log(body);

    const resp = await transaction(Product.knex(), trx => {
      return (
          Product.query(trx).insert(body)
      );
    });

    res.send(resp);
  });

  // Create a new Order
  router.post('/orders', async (req, res) => {
    const body = req.body;
    console.log(body);
    // It's a good idea to wrap `insertGraph` call in a transaction since it
    // may create multiple queries.
    const person = await Person.query().findById(body.customerId);
    if (!person) {
      throw createStatusCodeError(404);
    }

    const product = await Product.query().findById(body.productId);
    if (!product) {
      throw createStatusCodeError(404);
    }

    const resp = await transaction(Order.knex(), trx => {
      return (
          Order.query(trx).insert(body)
      );
    });

    res.send(resp);
  });
  // Create a new Person. Because we use `insertGraph` you can pass relations
  // with the person and they also get inserted and related to the person. If
  // all you want to do is insert a single person, `insertGraph` and `allowInsert`
  // can be replaced by `insert(req.body)`.
  router.post('/persons', async (req, res) => {
    const graph = req.body;

    // It's a good idea to wrap `insertGraph` call in a transaction since it
    // may create multiple queries.
    const insertedGraph = await transaction(Person.knex(), trx => {
      return (
        Person.query(trx)
          // For security reasons, limit the relations that can be inserted.
          .allowInsert('[pets, children.[pets, movies], movies, parent]')
          .insertGraph(graph)
      );
    });

    res.send(insertedGraph);
  });

  // Patch a Person.
  router.patch('/persons/:id', async (req, res) => {
    const person = await Person.query().patchAndFetchById(req.params.id, req.body);

    res.send(person);
  });

  // Patch a person and upsert its relations.
  router.patch('/persons/:id/upsert', async (req, res) => {
    const graph = req.body;

    // Make sure only one person was sent.
    if (Array.isArray(graph)) {
      throw createStatusCodeError(400);
    }

    // Make sure the person has the correct id because `upsertGraph` uses the id fields
    // to determine which models need to be updated and which inserted.
    graph.id = parseInt(req.params.id, 10);

    // It's a good idea to wrap `upsertGraph` call in a transaction since it
    // may create multiple queries.
    const upsertedGraph = await transaction(Person.knex(), trx => {
      return (
        Person.query(trx)
          // For security reasons, limit the relations that can be upserted.
          .allowUpsert('[pets, children.[pets, movies], movies, parent]')
          .upsertGraph(graph)
      );
    });

    res.send(upsertedGraph);
  });

  router.get('/products', async (req, res) => {
    // We don't need to check for the existence of the query parameters because
    // we call the `skipUndefined` method. It causes the query builder methods
    // to do nothing if one of the values is undefined.
    const products = await Product.query()
        .skipUndefined()
        // For security reasons, limit the relations that can be fetched.
        .allowEager('[pets, parent, children.[pets, movies.actors], movies.actors.pets, orders, products]')
        .eager(req.query.eager)
        .orderBy('id');

    res.send(products);
  });

  router.get('/orders', async (req, res) => {
    // We don't need to check for the existence of the query parameters because
    // we call the `skipUndefined` method. It causes the query builder methods
    // to do nothing if one of the values is undefined.
    const orders = await Order.query()
        .skipUndefined()
        // For security reasons, limit the relations that can be fetched.
        .allowEager('[pets, parent, children.[pets, movies.actors], movies.actors.pets, orders, products]')
        .eager(req.query.eager)
        .orderBy('id');

    res.send(orders);
  });


  // Get multiple Persons. The result can be filtered using query parameters
  // `minAge`, `maxAge` and `firstName`. Relations can be fetched eagerly
  // by giving a relation expression as the `eager` query parameter.
  router.get('/persons', async (req, res) => {
    // We don't need to check for the existence of the query parameters because
    // we call the `skipUndefined` method. It causes the query builder methods
    // to do nothing if one of the values is undefined.
    const persons = await Person.query()
      .skipUndefined()
      // For security reasons, limit the relations that can be fetched.
      .allowEager('[pets, parent, children.[pets, movies.actors], movies.actors.pets, orders]')
      .eager(req.query.eager)
      .where('age', '>=', req.query.minAge)
      .where('age', '<', req.query.maxAge)
      .where('firstName', 'like', req.query.firstName)
      .orderBy('firstName')
      // Order eagerly loaded pets by name.
      .modifyEager('[pets, children.pets]', qb => qb.orderBy('name'));

    res.send(persons);
  });

  // Get a single person.
  router.get('/persons/:id', async (req, res) => {
    const person = await Person.query().findById(req.params.id);

    res.send(person);
  });

  // Get a single order.
  router.get('/orders/:id', async (req, res) => {
    const orders = await Order.query().findById(req.params.id);

    res.send(orders);
  });

  // Get a single product.
  router.get('/products/:id', async (req, res) => {
    const product = await Product.query().findById(req.params.id);

    res.send(product);
  });

  // Delete a order.
  router.delete('/orders/:id', async (req, res) => {
    const count = await Order.query().deleteById(req.params.id);

    res.send({ dropped: count === 1 });
  });

  // Delete a product.
  router.delete('/products/:id', async (req, res) => {
    const count = await Product.query().deleteById(req.params.id);

    res.send({ dropped: count === 1 });
  });

  // Delete a person.
  router.delete('/persons/:id', async (req, res) => {
    const count = await Person.query().deleteById(req.params.id);

    res.send({ dropped: count === 1 });
  });

  // Add a child for a Person.
  router.post('/persons/:id/children', async (req, res) => {
    const person = await Person.query().findById(req.params.id);

    if (!person) {
      throw createStatusCodeError(404);
    }

    const child = await person.$relatedQuery('children').insert(req.body);

    res.send(child);
  });

  // Add a pet for a Person.
  router.post('/persons/:id/pets', async (req, res) => {
    const person = await Person.query().findById(req.params.id);

    if (!person) {
      throw createStatusCodeError(404);
    }

    const pet = await person.$relatedQuery<Animal>('pets').insert(req.body);

    res.send(pet);
  });


  // Get a Person's orders. The result can be filtered using query parameters
  // `name` and `species`.
  router.get('/persons/:id/orders', async (req, res) => {
    const person = await Person.query().findById(req.params.id);

    if (!person) {
      throw createStatusCodeError(404);
    }

    // We don't need to check for the existence of the query parameters because
    // we call the `skipUndefined` method. It causes the query builder methods
    // to do nothing if one of the values is undefined.
    const orders = await person
        .$relatedQuery<Order>('orders')
        .skipUndefined()

    res.send(orders);
  });


  // Get a Person's pets. The result can be filtered using query parameters
  // `name` and `species`.
  router.get('/persons/:id/pets', async (req, res) => {
    const person = await Person.query().findById(req.params.id);

    if (!person) {
      throw createStatusCodeError(404);
    }

    // We don't need to check for the existence of the query parameters because
    // we call the `skipUndefined` method. It causes the query builder methods
    // to do nothing if one of the values is undefined.
    const pets = await person
      .$relatedQuery<Animal>('pets')
      .skipUndefined()
      .where('name', 'like', req.query.name)
      .where('species', req.query.species);

    res.send(pets);
  });

  // Add a movie for a Person.
  router.post('/persons/:id/movies', async (req, res) => {
    // Inserting a movie for a person creates two queries: the movie insert query
    // and the join table row insert query. It is wise to use a transaction here.
    const movie = await transaction(Person.knex(), async function(trx) {
      const person = await Person.query(trx).findById(req.params.id);

      if (!person) {
        throw createStatusCodeError(404);
      }

      return person.$relatedQuery<Movie>('movies', trx).insert(req.body);
    });

    res.send(movie);
  });

  // Get a person's movies.
  router.get('/persons/:id/movies', async (req, res) => {
    const person = await Person.query().findById(req.params.id);

    if (!person) {
      throw createStatusCodeError(404);
    }

    const movies = await person.$relatedQuery<Movie>('movies');

    res.send(movies);
  });

  // Get a single pet.
  router.get('/pets/:id', async (req, res) => {
    const pet = await Animal.query().findById(req.params.id);

    res.send(pet);
  });

  // Add existing Person as an actor to a movie.
  router.post('/movies/:id/actors', async (req, res) => {
    const movie = await Movie.query().findById(req.params.id);

    if (!movie) {
      throw createStatusCodeError(404);
    }

    await movie.$relatedQuery<Person>('actors').relate(req.body.id);

    res.send(req.body);
  });

  // Get Movie's actors.
  router.get('/movies/:id/actors', async (req, res) => {
    const movie = await Movie.query().findById(req.params.id);

    if (!movie) {
      throw createStatusCodeError(404);
    }

    const actors = await movie.$relatedQuery<Person>('actors');

    res.send(actors);
  });

  // Get a single movie.
  router.get('/movies/:id', async (req, res) => {
    const movie = await Movie.query().findById(req.params.id);

    res.send(movie);
  });
};

// The error returned by this function is handled in the error handler middleware in app.js.
function createStatusCodeError(statusCode: number) {
  return Object.assign(new Error(), {
    statusCode
  });
}
