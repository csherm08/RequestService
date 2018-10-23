import { Model } from 'objection';
import Person from './Person';
import { join } from 'path';

export default class Order extends Model {
  readonly id!: number;
  product_name?: string;
  customerId?: Person;

  // Table name is the only required property.
  static tableName = 'orders';

  // Optional JSON schema. This is not the database schema! Nothing is generated
  // based on this. This is only used for validation. Whenever a model instance
  // is created it is checked against this schema. http://json-schema.org/.
  static jsonSchema = {
    type: 'object',
    required: ['productId', 'customerId'],

    properties: {
      id: { type: 'integer' },
      customerId: { type: 'integer' },
      productId: { type: 'integer' }
    }
  };

  // This relationMappings is a thunk, which prevents require loops:
  static relationMappings = () => ({
    customer: {
      relation: Model.HasOneRelation,
      // The related model. This can be either a Model subclass constructor or an
      // absolute file path to a module that exports one. We use the file path version
      // here to prevent require loops.
      modelClass: join(__dirname, 'Person'),
      join: {
        from: 'orders.customerId',
        to: 'persons.id'
      }
    },
    product: {
      relation: Model.HasOneRelation,
      modelClass: join(__dirname, 'Product'),
      join: {
        from: 'orders.productId',
        to: 'products.id'
      }
    }
  });
}
