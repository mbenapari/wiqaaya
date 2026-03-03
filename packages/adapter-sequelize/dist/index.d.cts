import { Sequelize } from 'sequelize';
import { WiqaayaAdapter } from '@wiqaaya/core';

declare function sequelizeAdapter(sequelize: Sequelize): WiqaayaAdapter;

export { sequelizeAdapter };
