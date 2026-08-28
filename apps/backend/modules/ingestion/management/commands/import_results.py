from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from modules.ingestion.services import import_process_directory


class Command(BaseCommand):
    help = "Import one UNMSM admission process from its directory of CSV files."

    def add_arguments(self, parser):
        parser.add_argument("directory", type=Path)
        parser.add_argument("--source-name", default="Resultados-UNMSM")
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        directory = options["directory"]
        if not directory.is_dir():
            raise CommandError(f"process directory does not exist: {directory}")
        result = import_process_directory(
            directory,
            source_name=options["source_name"],
            dry_run=options["dry_run"],
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"{'Dry run: ' if options['dry_run'] else ''}"
                f"total={result['total_rows'] if isinstance(result, dict) else result.total_rows} "
                f"imported={result['imported_rows'] if isinstance(result, dict) else result.imported_rows} "
                f"rejected={result['rejected_rows'] if isinstance(result, dict) else result.rejected_rows}"
            )
        )
