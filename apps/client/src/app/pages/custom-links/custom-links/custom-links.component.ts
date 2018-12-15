import { Component } from '@angular/core';
import { CustomLink } from '../../../core/database/custom-links/custom-link';
import { combineLatest, Observable, of } from 'rxjs';
import { CustomLinksFacade } from '../../../modules/custom-links/+state/custom-links.facade';
import { distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';
import { ListsFacade } from '../../../modules/list/+state/lists.facade';
import { WorkshopsFacade } from '../../../modules/workshop/+state/workshops.facade';
import { RotationsFacade } from '../../../modules/rotations/+state/rotations.facade';
import { RotationFoldersFacade } from '../../../modules/rotation-folders/+state/rotation-folders.facade';
import { NzMessageService } from 'ng-zorro-antd';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-custom-links',
  templateUrl: './custom-links.component.html',
  styleUrls: ['./custom-links.component.less']
})
export class CustomLinksComponent {

  public linksDisplay$: Observable<{ link: CustomLink, targetName: string }[]>;

  constructor(private customLinksFacade: CustomLinksFacade,
              private listsFacade: ListsFacade,
              private workshopsFacade: WorkshopsFacade,
              private rotationsFacade: RotationsFacade,
              private rotationFoldersFacade: RotationFoldersFacade,
              private message: NzMessageService,
              private translate: TranslateService) {
    this.linksDisplay$ = this.customLinksFacade.myCustomLinks$.pipe(
      switchMap(links => {
        if (links.length === 0) {
          return of([]);
        }
        return combineLatest(links.map(link => {
          return this.loadTargetName(link).pipe(map(targetName => {
            return {
              link: link,
              targetName: targetName
            };
          }));
        }));
      }),
      distinctUntilChanged((a, b) => {
        return JSON.stringify(a) === JSON.stringify(b);
      })
    );
    this.customLinksFacade.loadMyCustomLinks();
  }

  private loadTargetName(link: CustomLink): Observable<string> {
    switch (link.getType()) {
      case 'list': {
        this.listsFacade.load(link.getEntityId());
        return this.listsFacade.allListDetails$.pipe(
          map(lists => lists.find(l => l.$key === link.getEntityId())),
          filter(l => l !== undefined),
          tap(list => {
            if (list.notFound) {
              this.customLinksFacade.deleteCustomLink(link.$key);
            }
          }),
          map(list => list.name)
        );
      }
      case 'workshop': {
        this.workshopsFacade.loadWorkshop(link.getEntityId());
        return this.workshopsFacade.allWorkshops$.pipe(
          map(workshops => workshops.find(l => l.$key === link.getEntityId())),
          filter(l => l !== undefined),
          tap(workshop => {
            if (workshop.notFound) {
              this.customLinksFacade.deleteCustomLink(link.$key);
            }
          }),
          map(workshop => workshop.name)
        );
      }
      case 'rotation': {
        this.rotationsFacade.getRotation(link.getEntityId());
        return this.rotationsFacade.allRotations$.pipe(
          map(rotations => rotations.find(l => l.$key === link.getEntityId())),
          filter(l => l !== undefined),
          tap(rotation => {
            if (rotation.notFound) {
              this.customLinksFacade.deleteCustomLink(link.$key);
            }
          }),
          map(rotation => rotation.getName())
        );
      }
      case 'rotation-folder': {
        this.rotationFoldersFacade.loadFolder(link.getEntityId());
        return this.rotationFoldersFacade.allRotationFolders$.pipe(
          map(folders => folders.find(l => l.$key === link.getEntityId())),
          filter(l => l !== undefined),
          tap(folder => {
            if (folder.notFound) {
              this.customLinksFacade.deleteCustomLink(link.$key);
            }
          }),
          map(folder => folder.name)
        );
      }
      case 'template': {
        this.listsFacade.load(link.getEntityId());
        return this.listsFacade.allListDetails$.pipe(
          map(lists => lists.find(l => l.$key === link.getEntityId())),
          filter(l => l !== undefined),
          tap(list => {
            if (list.notFound) {
              this.customLinksFacade.deleteCustomLink(link.$key);
            }
          }),
          map(list => list.name)
        );
      }
    }
  }

  deleteLink(key: string): void {
    this.customLinksFacade.deleteCustomLink(key);
  }

  afterLinkCopy(): void {
    this.message.success(this.translate.instant('Share_link_copied'));
  }

}