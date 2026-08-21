export class BaseModel {
  constructor(tableName, db) {
    this.tableName = tableName;
    this.db = db;
  }

  async findAll() {
    const [rows] = await this.db.execute(`SELECT * FROM ${this.tableName}`);
    return rows;
  }

  async findById(id) {
    const [rows] = await this.db.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0];
  }

  async findOne(whereClause, values = []) {
    const [rows] = await this.db.execute(
      `SELECT * FROM ${this.tableName} WHERE ${whereClause} LIMIT 1`,
      values
    );
    return rows[0];
  }

  async create(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    const query = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders})`;

    const [result] = await this.db.execute(query, values);
    return { insertId: result.insertId, affectedRows: result.affectedRows };
  }

  async updateById(id, data) {
    const entries = Object.entries(data);
    const assignments = entries.map(([key]) => `${key} = ?`).join(', ');
    const values = entries.map(([, value]) => value);

    await this.db.execute(
      `UPDATE ${this.tableName} SET ${assignments} WHERE id = ?`,
      [...values, id]
    );

    return this.findById(id);
  }

  async deleteById(id) {
    const result = await this.db.execute(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return result[0].affectedRows;
  }
}
