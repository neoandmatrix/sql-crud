const getController = (Name, name, url) => `import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
  import { ${Name}Service } from './${name}.service';
  import { ${Name} } from '../../entities/${Name}.entity';

  @Controller('${url}')
  export class ${Name}Controller {
    constructor(private readonly ${name}Service: ${Name}Service) { }
  
    @Get()
    async find(@Query() query: Record<string, any>) {
      return await this.${name}Service._find(query);
    }
  
    @Get('/:id?')
    async get(@Query() query: Record<string, any>, @Param('id') id: string) {
      return await this.${name}Service._get(id, query);
    }
  
    @Post()
    async create(
      @Body() create${Name}Dto: ${Name}
    ) {
      return await this.${name}Service._create(create${Name}Dto);
    }
  
    @Patch('/:id?')
    async patch(
      @Query() query,
      @Body() patch${Name}Dto: Partial<${Name}>,
      @Param('id',ParseIntPipe) id: number,
    ) {
      return await this.${name}Service._patch(id, patch${Name}Dto, query);
    }
  
    @Delete('/:id?')
    async delete(@Param('id',ParseIntPipe) id: number, @Query() query: Record<string, any>) {
      return await this.${name}Service._remove(id, query, user);
    }
  }
  `;

module.exports = getController;
