import {Column, MigrationInterface, QueryRunner, TableColumn, TableForeignKey} from "typeorm";

export default class AddCustomerIdToOrders1603039650884 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.addColumn(
        'orders',
        new TableColumn({
          name: 'customer_id',
          type: 'uuid',
          isNullable: true,
        })
      )

      await queryRunner.createForeignKey(
        'orders',
        new TableForeignKey({
          name: 'OrdersCustomer',
          columnNames: ['customer_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'customers',
          onDelete: `SET NULL`,   // ao excluiro cliente, define como NULL no pedido (procurar por soft delete)
        })
      )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.dropForeignKey('orders', 'OrdersCustomer');

      await queryRunner.dropColumn('orders', 'customer_id');
    }

}
