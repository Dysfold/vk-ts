import { DriverManager } from 'java.sql';

export class DB {
  constructor() {
    const conn = DriverManager.getConnection(
      'jdbc:postgresql://localhost:5432/mc',
      'postgres',
      'postgres',
    );
    console.log(conn);
  }
}

const db = new DB();
