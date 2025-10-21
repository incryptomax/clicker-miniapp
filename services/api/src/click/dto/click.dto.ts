import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ClickDto {
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  delta: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  sequence?: number;
}
