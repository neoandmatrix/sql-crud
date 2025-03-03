const getModule = (Name, name) => `import { Module } from '@nestjs/common';
import { ${Name}Controller } from './${name}.controller';
import { ${Name}Service } from './${name}.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ${Name}Schema } from 'src/schemas/${Name}.schema';


@Module({
  imports: [
   TypeOrmModule.forFeature([${Name}Schema])
  ],
  controllers: [${Name}Controller],
  providers: [
  ${Name}Service,
  ],
  exports: [${Name}Service],
})
export class ${Name}Module {}
`;

module.exports = getModule;
